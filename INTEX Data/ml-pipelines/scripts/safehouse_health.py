"""
Safehouse Outcomes Forecast Pipeline
--------------------------------------
Reads safehouses, safehouse_monthly_metrics, partner_assignments,
and donation_allocations from Azure SQL.
Trains 3 Ridge regression models using lag-1 features.
Writes predictions to ml_safehouse_health_predictions (replaced each run).

Output columns:
  safehouse_id, safehouse_code, name, region, month_start,
  pred_avg_education_progress, pred_avg_health_score, pred_incident_count,
  alert_tier, run_date
"""
from __future__ import annotations

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from db import get_engine

TARGETS = ["avg_education_progress", "avg_health_score", "incident_count"]


def build_model_df(
    safehouses: pd.DataFrame,
    metrics: pd.DataFrame,
    partner_assignments: pd.DataFrame,
    donation_allocations: pd.DataFrame,
) -> pd.DataFrame:
    metrics = metrics.copy()
    metrics["month_start"] = pd.to_datetime(metrics["month_start"], errors="coerce")

    sh_cols = [c for c in ["safehouse_id", "safehouse_code", "name", "region", "capacity_girls", "capacity_staff", "current_occupancy"] if c in safehouses.columns]
    sh = safehouses[sh_cols].copy()

    # Partner coverage per safehouse
    pa = partner_assignments.copy()
    pa["safehouse_id"] = pd.to_numeric(pa["safehouse_id"], errors="coerce")
    partner_cov = (
        pa.dropna(subset=["safehouse_id"])
        .groupby("safehouse_id")
        .agg(
            partners_n=("partner_id", pd.Series.nunique),
            assignments_n=("assignment_id", "count"),
            program_areas_n=("program_area", pd.Series.nunique),
            primary_assignments_n=("is_primary", lambda s: s.fillna(False).astype(bool).sum()),
        )
        .reset_index()
    )

    # Monthly funding per safehouse
    da = donation_allocations.copy()
    da["allocation_date"] = pd.to_datetime(da["allocation_date"], errors="coerce")
    da["month_start"] = da["allocation_date"].dt.to_period("M").dt.to_timestamp()
    da["safehouse_id"] = pd.to_numeric(da["safehouse_id"], errors="coerce")
    funding = (
        da.dropna(subset=["safehouse_id", "month_start"])
        .groupby(["safehouse_id", "month_start"])
        .agg(
            total_funding=("amount_allocated", "sum"),
            n_allocations=("allocation_id", "count"),
            n_program_areas_funded=("program_area", pd.Series.nunique),
        )
        .reset_index()
    )

    df = (
        metrics
        .merge(sh, on="safehouse_id", how="left")
        .merge(partner_cov, on="safehouse_id", how="left")
        .merge(funding, on=["safehouse_id", "month_start"], how="left")
    )

    for c in ["total_funding", "n_allocations", "n_program_areas_funded"]:
        if c in df.columns:
            df[c] = df[c].fillna(0)

    df = df.sort_values(["safehouse_id", "month_start"]).reset_index(drop=True)

    numeric_base = [c for c in [
        "active_residents", "avg_education_progress", "avg_health_score",
        "process_recording_count", "home_visitation_count", "incident_count",
        "capacity_girls", "capacity_staff", "current_occupancy",
        "partners_n", "assignments_n", "program_areas_n", "primary_assignments_n",
        "total_funding", "n_allocations", "n_program_areas_funded",
    ] if c in df.columns]

    for c in numeric_base:
        df[f"lag1_{c}"] = df.groupby("safehouse_id")[c].shift(1)

    lag_cols = [c for c in df.columns if c.startswith("lag1_")]
    feature_cols = lag_cols + (["region"] if "region" in df.columns else [])

    model_df = df.dropna(subset=[f"lag1_{t}" for t in TARGETS if f"lag1_{t}" in df.columns]).copy()
    return model_df, feature_cols


def fit_ridge(model_df: pd.DataFrame, feature_cols: list[str], target: str) -> tuple[Pipeline, float]:
    y = pd.to_numeric(model_df[target], errors="coerce")
    X = model_df[feature_cols].copy()

    numeric_cols = X.select_dtypes(include=["number"]).columns.tolist()
    cat_cols = [c for c in X.columns if c not in numeric_cols]
    for c in cat_cols:
        X[c] = X[c].astype("object")

    mask = y.notna()
    X_tr, X_te, y_tr, y_te = train_test_split(X.loc[mask], y.loc[mask], test_size=0.2, random_state=42)

    pre = ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("scl", StandardScaler())]), numeric_cols),
        ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")), ("ohe", OneHotEncoder(handle_unknown="ignore"))]), cat_cols),
    ])
    pipe = Pipeline([("pre", pre), ("model", Ridge(alpha=1.0))])
    pipe.fit(X_tr, y_tr)

    r2 = r2_score(y_te, pipe.predict(X_te))
    mae = mean_absolute_error(y_te, pipe.predict(X_te))
    print(f"  {target}: R²={r2:.3f}, MAE={mae:.3f}")
    return pipe, r2


def main() -> None:
    engine = get_engine()

    print("Loading data from Azure SQL...")
    safehouses = pd.read_sql("SELECT * FROM safehouses", engine)
    metrics = pd.read_sql("SELECT * FROM safehouse_monthly_metrics", engine)
    partner_assignments = pd.read_sql("SELECT * FROM partner_assignments", engine)
    donation_allocations = pd.read_sql("SELECT * FROM donation_allocations", engine)

    print(f"  {len(safehouses)} safehouses, {len(metrics)} monthly metric rows")

    model_df, feature_cols = build_model_df(safehouses, metrics, partner_assignments, donation_allocations)

    print("Training models...")
    pipes: dict[str, Pipeline] = {}
    for t in TARGETS:
        pipe, _ = fit_ridge(model_df, feature_cols, t)
        pipes[t] = pipe

    # Predict for latest available month per safehouse
    predict_rows = model_df.sort_values(["safehouse_id", "month_start"]).groupby("safehouse_id").tail(1).copy()
    X_latest = predict_rows[feature_cols].copy()
    for c in [c for c in X_latest.columns if c not in X_latest.select_dtypes(include=["number"]).columns]:
        X_latest[c] = X_latest[c].astype("object")

    out = predict_rows[["safehouse_id", "month_start"]].merge(
        safehouses[["safehouse_id", "safehouse_code", "name", "region"]],
        on="safehouse_id", how="left",
    )
    for t in TARGETS:
        out[f"pred_{t}"] = pipes[t].predict(X_latest)

    # Alert tier: flag safehouses with any concerning prediction
    def alert_tier(row: pd.Series) -> str:
        if row.get("pred_incident_count", 0) > 0.5:
            return "Alert"
        if row.get("pred_avg_health_score", 5) < 2.5:
            return "Alert"
        if row.get("pred_avg_education_progress", 100) < 50:
            return "Watch"
        return "Stable"

    out["alert_tier"] = out.apply(alert_tier, axis=1)
    out["run_date"] = pd.Timestamp.now().date()

    out.to_sql("ml_safehouse_health_predictions", engine, if_exists="replace", index=False)
    print(f"Done. Wrote {len(out)} rows to ml_safehouse_health_predictions.")
    print(f"  Alert: {(out['alert_tier'] == 'Alert').sum()}  |  Watch: {(out['alert_tier'] == 'Watch').sum()}  |  Stable: {(out['alert_tier'] == 'Stable').sum()}")


if __name__ == "__main__":
    main()
