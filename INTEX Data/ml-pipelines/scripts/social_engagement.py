"""
Social Media Donor Engagement Pipeline
----------------------------------------
Reads supporters, donations, and social_media_posts from Azure SQL.
Combines RFM features with per-supporter social media attribution signals.
Trains a RandomForestClassifier to predict donation engagement likelihood.
Writes predictions to ml_social_engagement_predictions (replaced each run).

Output columns:
  supporter_id, display_name, email, engagement_tier, engagement_probability,
  suggested_action, recency_days, donation_frequency, donation_value_sum,
  referral_linked_donations, preferred_platform, preferred_topic,
  acquisition_channel, supporter_type, region, country, run_date
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


def build_features(
    supporters: pd.DataFrame,
    donations: pd.DataFrame,
    posts: pd.DataFrame,
) -> pd.DataFrame:
    donations = donations.copy()
    donations["donation_date"] = pd.to_datetime(donations["donation_date"], errors="coerce")
    donations["estimated_value"] = pd.to_numeric(donations["estimated_value"], errors="coerce")

    last_month = donations["donation_date"].max().to_period("M").to_timestamp()
    months = pd.date_range(
        donations["donation_date"].min().to_period("M").to_timestamp(),
        last_month, freq="MS",
    )

    snapshots = pd.MultiIndex.from_product(
        [supporters["supporter_id"].unique(), months],
        names=["supporter_id", "snapshot_date"],
    ).to_frame(index=False)

    # --- RFM features per snapshot ---
    rfm_rows = []
    for sid, sdate in snapshots[["supporter_id", "snapshot_date"]].itertuples(index=False):
        hist = donations[(donations["supporter_id"] == sid) & (donations["donation_date"] < sdate)]
        if hist.empty:
            rfm_rows.append((sid, sdate, np.nan, 0, 0.0, 0.0, 0.0, 0, None, None))
            continue
        recency_days = (sdate - hist["donation_date"].max()).days
        tenure_days = (sdate - hist["donation_date"].min()).days
        freq = len(hist)
        value_sum = float(hist["estimated_value"].fillna(0).sum())
        value_avg = float(hist["estimated_value"].fillna(0).mean())
        recurring = int(hist["is_recurring"].fillna(False).astype(bool).sum()) if "is_recurring" in hist.columns else 0
        top_channel = hist["channel_source"].mode().iloc[0] if "channel_source" in hist.columns and hist["channel_source"].notna().any() else None
        top_type = hist["donation_type"].mode().iloc[0] if "donation_type" in hist.columns and hist["donation_type"].notna().any() else None
        rfm_rows.append((sid, sdate, recency_days, freq, value_sum, value_avg, tenure_days, recurring, top_channel, top_type))

    rfm = pd.DataFrame(rfm_rows, columns=[
        "supporter_id", "snapshot_date",
        "recency_days", "donation_frequency", "donation_value_sum", "value_avg",
        "tenure_days", "recurring_count", "top_channel_source", "top_donation_type",
    ])

    # --- Social media attribution features per supporter (static, not per snapshot) ---
    sm_features = _build_sm_features(supporters, donations, posts)

    # --- Labels ---
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
        .merge(sm_features, on="supporter_id", how="left")
    )
    return model_df[model_df["donation_frequency"] > 0].copy()


def _build_sm_features(
    supporters: pd.DataFrame,
    donations: pd.DataFrame,
    posts: pd.DataFrame,
) -> pd.DataFrame:
    """Build per-supporter social media attribution features."""
    posts = posts.copy()
    posts["created_at"] = pd.to_datetime(posts["created_at"], errors="coerce")

    # Donations linked to a referral post
    referral_donations = donations[donations["referral_post_id"].notna()].merge(
        posts[["post_id", "platform", "content_topic", "call_to_action_type", "campaign_name"]],
        left_on="referral_post_id", right_on="post_id", how="left",
    )

    per_supporter = (
        referral_donations.groupby("supporter_id")
        .agg(
            referral_linked_donations=("donation_id", "count"),
            preferred_platform=("platform", lambda s: s.mode().iloc[0] if s.notna().any() else None),
            preferred_topic=("content_topic", lambda s: s.mode().iloc[0] if s.notna().any() else None),
            preferred_cta=("call_to_action_type", lambda s: s.mode().iloc[0] if s.notna().any() else None),
        )
        .reset_index()
    )

    # Org-level SM activity in last 60 days (same value for all supporters — signals active posting period)
    cutoff = posts["created_at"].max() - pd.Timedelta(days=60)
    recent_posts = posts[posts["created_at"] >= cutoff]
    sm_posts_last_60d = len(recent_posts)
    sm_active_campaign = int(recent_posts["campaign_name"].notna().any()) if "campaign_name" in recent_posts.columns else 0

    sm_features = supporters[["supporter_id"]].merge(per_supporter, on="supporter_id", how="left")
    sm_features["referral_linked_donations"] = sm_features["referral_linked_donations"].fillna(0).astype(int)
    sm_features["sm_posts_last_60d"] = sm_posts_last_60d
    sm_features["sm_active_campaign"] = sm_active_campaign

    return sm_features


def train_and_predict(model_df: pd.DataFrame) -> pd.DataFrame:
    TARGET = "will_donate_next_90d"
    exclude = {"supporter_id", "snapshot_date", TARGET}
    feature_cols = [c for c in model_df.columns if c not in exclude]

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

    latest["engagement_probability"] = pipe.predict_proba(X_latest)[:, 1]

    p75 = latest["engagement_probability"].quantile(0.75)
    p35 = latest["engagement_probability"].quantile(0.35)

    def engagement_tier(p: float) -> str:
        if p >= p75:
            return "High"
        if p >= p35:
            return "Medium"
        return "Low"

    latest["engagement_tier"] = latest["engagement_probability"].apply(engagement_tier)

    def suggest_action(row: pd.Series) -> str:
        tier = row["engagement_tier"]
        referral_n = row.get("referral_linked_donations", 0) or 0
        if tier == "High":
            if referral_n > 0:
                return "Send targeted SM campaign — this donor responds to social content"
            return "Send personalized thank-you + campaign update"
        if tier == "Medium":
            if referral_n > 0:
                return "Try a direct SM message or story tag — they engage digitally"
            return "Send campaign newsletter with impact story"
        if referral_n > 0:
            return "Try a direct SM message or story tag — they engage digitally"
        return "Personal outreach (call/meeting) — at risk of lapsing"

    latest["suggested_action"] = latest.apply(suggest_action, axis=1)
    return latest


def main() -> None:
    engine = get_engine()

    print("Loading data from Azure SQL...")
    supporters = pd.read_sql("SELECT * FROM supporters", engine)
    donations = pd.read_sql("SELECT * FROM donations", engine)
    posts = pd.read_sql("SELECT * FROM social_media_posts", engine)

    print(f"  {len(supporters)} supporters, {len(donations)} donations, {len(posts)} posts")

    model_df = build_features(supporters, donations, posts)
    latest = train_and_predict(model_df)

    latest = latest.merge(
        supporters[["supporter_id", "display_name", "email"]],
        on="supporter_id", how="left",
    )

    out_cols = [c for c in [
        "supporter_id", "display_name", "email",
        "engagement_tier", "engagement_probability", "suggested_action",
        "recency_days", "donation_frequency", "donation_value_sum",
        "referral_linked_donations", "preferred_platform", "preferred_topic",
        "acquisition_channel", "supporter_type", "region", "country",
    ] if c in latest.columns]

    out = latest[out_cols].sort_values("engagement_probability", ascending=False).copy()
    out["run_date"] = pd.Timestamp.now().date()

    out.to_sql("ml_social_engagement_predictions", engine, if_exists="replace", index=False)
    print(f"Done. Wrote {len(out)} rows to ml_social_engagement_predictions.")
    print(f"  High: {(out['engagement_tier'] == 'High').sum()}  |  Medium: {(out['engagement_tier'] == 'Medium').sum()}  |  Low: {(out['engagement_tier'] == 'Low').sum()}")


if __name__ == "__main__":
    main()
