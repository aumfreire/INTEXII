"""
Donor Lapse Risk Pipeline
-------------------------
Reads supporters + donations from Azure SQL.
Trains a RandomForestClassifier on RFM snapshot features.
Writes predictions to ml_donor_lapse_predictions (replaced each run).

Output columns:
  supporter_id, display_name, email, supporter_type, relationship_type,
  region, country, snapshot_date, lapse_risk_score, risk_tier,
  recency_days, frequency, value_sum, top_channel_source, top_donation_type,
  run_date
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from db import get_engine


def build_rfm(supporters: pd.DataFrame, donations: pd.DataFrame) -> pd.DataFrame:
    donations = donations.copy()
    donations["donation_date"] = pd.to_datetime(donations["donation_date"], errors="coerce")
    donations["estimated_value"] = pd.to_numeric(donations["estimated_value"], errors="coerce")

    last_month = donations["donation_date"].max().to_period("M").to_timestamp()
    months = pd.date_range(
        donations["donation_date"].min().to_period("M").to_timestamp(),
        last_month,
        freq="MS",
    )

    snapshots = pd.MultiIndex.from_product(
        [supporters["supporter_id"].unique(), months],
        names=["supporter_id", "snapshot_date"],
    ).to_frame(index=False)

    rows = []
    for sid, sdate in snapshots[["supporter_id", "snapshot_date"]].itertuples(index=False):
        hist = donations[(donations["supporter_id"] == sid) & (donations["donation_date"] < sdate)]
        if hist.empty:
            rows.append((sid, sdate, np.nan, 0, 0.0, 0.0, 0.0, 0, 0, None, None))
            continue
        recency_days = (sdate - hist["donation_date"].max()).days
        tenure_days = (sdate - hist["donation_date"].min()).days
        freq = len(hist)
        value_sum = float(hist["estimated_value"].fillna(0).sum())
        value_avg = float(hist["estimated_value"].fillna(0).mean())
        recurring_count = int(hist["is_recurring"].fillna(False).astype(bool).sum()) if "is_recurring" in hist.columns else 0
        unique_types = int(hist["donation_type"].nunique()) if "donation_type" in hist.columns else 0
        top_channel = hist["channel_source"].mode().iloc[0] if "channel_source" in hist.columns and hist["channel_source"].notna().any() else None
        top_type = hist["donation_type"].mode().iloc[0] if "donation_type" in hist.columns and hist["donation_type"].notna().any() else None
        rows.append((sid, sdate, recency_days, freq, value_sum, value_avg, tenure_days, recurring_count, unique_types, top_channel, top_type))

    rfm = pd.DataFrame(rows, columns=[
        "supporter_id", "snapshot_date",
        "recency_days", "frequency", "value_sum", "value_avg",
        "tenure_days", "recurring_count", "unique_types",
        "top_channel_source", "top_donation_type",
    ])

    # Label: did supporter donate in the next 90 days from this snapshot?
    HORIZON = 90
    label_rows = []
    for sid, sdate in snapshots[["supporter_id", "snapshot_date"]].itertuples(index=False):
        fut = donations[
            (donations["supporter_id"] == sid)
            & (donations["donation_date"] >= sdate)
            & (donations["donation_date"] < sdate + pd.Timedelta(days=HORIZON))
        ]
        label_rows.append((sid, sdate, int(len(fut) > 0)))

    labels = pd.DataFrame(label_rows, columns=["supporter_id", "snapshot_date", "will_donate_next_90d"])

    static_cols = [c for c in ["supporter_type", "relationship_type", "region", "country", "acquisition_channel", "status"] if c in supporters.columns]
    static = supporters[["supporter_id"] + static_cols].copy()

    model_df = (
        rfm
        .merge(labels, on=["supporter_id", "snapshot_date"], how="left")
        .merge(static, on="supporter_id", how="left")
    )
    return model_df[model_df["frequency"] > 0].copy()


def train_and_predict(model_df: pd.DataFrame) -> pd.DataFrame:
    TARGET = "will_donate_next_90d"
    feature_cols = [c for c in model_df.columns if c not in {"supporter_id", "snapshot_date", TARGET}]

    X = model_df[feature_cols].copy()
    y = model_df[TARGET].astype(int)

    numeric_cols = X.select_dtypes(include=["number"]).columns.tolist()
    cat_cols = [c for c in X.columns if c not in numeric_cols]
    for c in cat_cols:
        X[c] = X[c].astype("object")

    X_train, _, y_train, _ = train_test_split(
        X, y, test_size=0.2, random_state=42,
        stratify=y if y.nunique() > 1 and y.value_counts().min() >= 2 else None,
    )

    pre = ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("scl", StandardScaler())]), numeric_cols),
        ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")), ("ohe", OneHotEncoder(handle_unknown="ignore"))]), cat_cols),
    ])
    pipe = Pipeline([
        ("pre", pre),
        ("model", RandomForestClassifier(n_estimators=200, max_depth=10, class_weight="balanced", random_state=42, n_jobs=-1)),
    ])
    pipe.fit(X_train, y_train)

    latest = model_df.sort_values(["supporter_id", "snapshot_date"]).groupby("supporter_id").tail(1).copy()
    X_latest = latest[feature_cols].copy()
    for c in cat_cols:
        if c in X_latest.columns:
            X_latest[c] = X_latest[c].astype("object")

    latest["lapse_risk_score"] = pipe.predict_proba(X_latest)[:, 1]

    # Low probability of donating = high lapse risk
    def risk_tier(p: float) -> str:
        if p < 0.33:
            return "High"
        if p < 0.66:
            return "Medium"
        return "Low"

    latest["risk_tier"] = latest["lapse_risk_score"].apply(risk_tier)
    return latest


def main() -> None:
    engine = get_engine()

    print("Loading data from Azure SQL...")
    supporters = pd.read_sql("SELECT * FROM supporters", engine)
    donations = pd.read_sql("SELECT * FROM donations", engine)

    print(f"  {len(supporters)} supporters, {len(donations)} donations")

    model_df = build_rfm(supporters, donations)
    latest = train_and_predict(model_df)

    latest = latest.merge(
        supporters[["supporter_id", "display_name", "email"]],
        on="supporter_id", how="left",
    )

    out_cols = [c for c in [
        "supporter_id", "display_name", "email",
        "supporter_type", "relationship_type", "region", "country",
        "snapshot_date", "lapse_risk_score", "risk_tier",
        "recency_days", "frequency", "value_sum",
        "top_channel_source", "top_donation_type",
    ] if c in latest.columns]

    out = latest[out_cols].sort_values("lapse_risk_score").copy()
    out["run_date"] = pd.Timestamp.now().date()

    out.to_sql("ml_donor_lapse_predictions", engine, if_exists="replace", index=False)
    print(f"Done. Wrote {len(out)} rows to ml_donor_lapse_predictions.")
    print(f"  High risk: {(out['risk_tier'] == 'High').sum()}  |  Medium: {(out['risk_tier'] == 'Medium').sum()}  |  Low: {(out['risk_tier'] == 'Low').sum()}")


if __name__ == "__main__":
    main()
