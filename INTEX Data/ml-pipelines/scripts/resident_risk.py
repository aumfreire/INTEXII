"""
Resident 30-Day Risk Assessment
---------------------------------
Reads residents, health_wellbeing_records, education_records,
incident_reports, and intervention_plans from Azure SQL.

Uses rule-based thresholds (not ML) to flag each active resident
across three dimensions for the next 30 days:
  - Health Risk
  - Education Risk
  - Incident Risk

An Overall Risk is derived from the worst of the three.

Writes results to ml_resident_risk_predictions (replaced each run).

Output columns:
  resident_id, case_control_no, internal_code, safehouse_id,
  case_category, current_risk_level,
  health_risk,     health_risk_reason,
  education_risk,  education_risk_reason,
  incident_risk,   incident_risk_reason,
  overall_risk,
  last_health_score, last_attendance_rate, last_progress_percent,
  incidents_last_30d, incidents_last_90d,
  active_plan_status, plan_target_date,
  run_date
"""
from __future__ import annotations

import pandas as pd
from datetime import date

from db import get_engine

# ─────────────────────────────────────────────────────────────────────────────
# Thresholds — adjust these as staff learn what works for their residents
# ─────────────────────────────────────────────────────────────────────────────
HEALTH = {
    "score_low":         2.5,   # any single score (general/nutrition/sleep/energy) below this → High
    "score_medium":      3.0,   # below this → Medium
    "drop_high":         0.75,  # general_health_score dropped this much in last 2 months → High
    "drop_medium":       0.40,  # dropped this much → Medium
}
EDUCATION = {
    "attendance_high":   0.70,  # attendance rate below this → High
    "attendance_medium": 0.80,  # below this → Medium
    "progress_drop_high":   10, # progress_percent dropped this many pp last month → High
    "progress_drop_medium":  5, # dropped this many pp → Medium
    "not_enrolled":      True,  # enrollment_status != "Enrolled" → at least Medium
}
INCIDENT = {
    "days_recent":       30,    # any incident in this window → at least Medium
    "days_medium":       90,    # any incident in this window → at least Low watch
    "severity_high":     {"High", "Critical", "Severe"},   # severity values that trigger High
    "unresolved_high":   True,  # unresolved incident → High regardless of severity
    "plan_at_risk":      {"At Risk", "On Hold"},            # plan statuses that raise incident risk
}


def tier(high: bool, medium: bool) -> str:
    if high:
        return "High"
    if medium:
        return "Medium"
    return "Low"


def assess_health(
    resident_id: int,
    health: pd.DataFrame,
) -> tuple[str, str]:
    """Returns (risk_tier, reason)."""
    recs = health[health["resident_id"] == resident_id].copy()
    recs["record_date"] = pd.to_datetime(recs["record_date"], errors="coerce")
    recs = recs.sort_values("record_date")

    if recs.empty:
        return "Medium", "No health records on file"

    latest = recs.iloc[-1]

    score_cols = ["general_health_score", "nutrition_score", "sleep_quality_score", "energy_level_score"]
    available = [c for c in score_cols if c in recs.columns and pd.notna(latest.get(c))]

    # Check for any score below thresholds
    for col in available:
        val = float(latest[col])
        if val < HEALTH["score_low"]:
            return "High", f"{col.replace('_', ' ').title()} is critically low ({val:.1f}/5)"
        if val < HEALTH["score_medium"]:
            return "Medium", f"{col.replace('_', ' ').title()} is below normal ({val:.1f}/5)"

    # Check for declining trend in general health (last 2 months)
    if "general_health_score" in recs.columns and len(recs) >= 2:
        prev = recs.iloc[-2]["general_health_score"]
        curr = latest["general_health_score"]
        if pd.notna(prev) and pd.notna(curr):
            drop = float(prev) - float(curr)
            if drop >= HEALTH["drop_high"]:
                return "High", f"General health dropped {drop:.2f} points in last 2 months"
            if drop >= HEALTH["drop_medium"]:
                return "Medium", f"General health declined {drop:.2f} points in last 2 months"

    return "Low", "Health scores stable and within normal range"


def assess_education(
    resident_id: int,
    education: pd.DataFrame,
) -> tuple[str, str]:
    """Returns (risk_tier, reason)."""
    recs = education[education["resident_id"] == resident_id].copy()
    recs["record_date"] = pd.to_datetime(recs["record_date"], errors="coerce")
    recs = recs.sort_values("record_date")

    if recs.empty:
        return "Medium", "No education records on file"

    latest = recs.iloc[-1]

    # Enrollment check
    enrollment = str(latest.get("enrollment_status", "")).strip().lower()
    if enrollment and enrollment not in {"enrolled", "active", ""}:
        return "Medium", f"Enrollment status is '{latest.get('enrollment_status')}'"

    # Attendance
    if "attendance_rate" in recs.columns and pd.notna(latest.get("attendance_rate")):
        att = float(latest["attendance_rate"])
        if att < EDUCATION["attendance_high"]:
            return "High", f"Attendance rate critically low ({att:.0%})"
        if att < EDUCATION["attendance_medium"]:
            return "Medium", f"Attendance rate below target ({att:.0%})"

    # Progress drop
    if "progress_percent" in recs.columns and len(recs) >= 2:
        prev = recs.iloc[-2]["progress_percent"]
        curr = latest["progress_percent"]
        if pd.notna(prev) and pd.notna(curr):
            drop = float(prev) - float(curr)
            if drop >= EDUCATION["progress_drop_high"]:
                return "High", f"Education progress dropped {drop:.1f}pp last month"
            if drop >= EDUCATION["progress_drop_medium"]:
                return "Medium", f"Education progress declined {drop:.1f}pp last month"

    return "Low", "Attendance and progress on track"


def assess_incident(
    resident_id: int,
    incidents: pd.DataFrame,
    plans: pd.DataFrame,
    today: date,
) -> tuple[str, str]:
    """Returns (risk_tier, reason)."""
    res_incidents = incidents[incidents["resident_id"] == resident_id].copy()
    res_incidents["incident_date"] = pd.to_datetime(res_incidents["incident_date"], errors="coerce")

    cutoff_30 = pd.Timestamp(today) - pd.Timedelta(days=30)
    cutoff_90 = pd.Timestamp(today) - pd.Timedelta(days=90)

    recent_30 = res_incidents[res_incidents["incident_date"] >= cutoff_30]
    recent_90 = res_incidents[res_incidents["incident_date"] >= cutoff_90]

    # Unresolved incidents
    if "resolved" in res_incidents.columns:
        unresolved = res_incidents[res_incidents["resolved"].fillna(False) == False]
        if not unresolved.empty:
            return "High", f"{len(unresolved)} unresolved incident(s) on record"

    # Recent incidents with high severity
    if not recent_30.empty:
        if "severity" in recent_30.columns:
            severe = recent_30[recent_30["severity"].isin(INCIDENT["severity_high"])]
            if not severe.empty:
                return "High", f"{len(severe)} high-severity incident(s) in last 30 days"
        return "Medium", f"{len(recent_30)} incident(s) in last 30 days"

    # Check intervention plan status
    res_plans = plans[plans["resident_id"] == resident_id]
    if not res_plans.empty:
        active_plans = res_plans[res_plans["status"].isin(INCIDENT["plan_at_risk"])]
        if not active_plans.empty:
            statuses = ", ".join(active_plans["status"].dropna().unique())
            return "High", f"Intervention plan status: {statuses}"

        # Plan target date overdue
        if "target_date" in res_plans.columns:
            overdue = res_plans[
                res_plans["target_date"].notna()
                & (pd.to_datetime(res_plans["target_date"], errors="coerce") < pd.Timestamp(today))
                & (~res_plans["status"].isin({"Achieved", "Closed"}))
            ]
            if not overdue.empty:
                return "Medium", f"{len(overdue)} intervention plan(s) past target date"

    if not recent_90.empty:
        return "Medium", f"{len(recent_90)} incident(s) in last 90 days — monitor"

    return "Low", "No recent incidents and plans on track"


def overall_risk(health: str, education: str, incident: str) -> str:
    tiers = {health, education, incident}
    if "High" in tiers:
        return "High"
    if "Medium" in tiers:
        return "Medium"
    return "Low"


def main() -> None:
    engine = get_engine()
    today = date.today()

    print("Loading data from Azure SQL...")
    residents = pd.read_sql(
        "SELECT resident_id, case_control_no, internal_code, safehouse_id, "
        "case_status, case_category, current_risk_level FROM residents",
        engine,
    )
    health = pd.read_sql("SELECT * FROM health_wellbeing_records", engine)
    education = pd.read_sql("SELECT * FROM education_records", engine)
    incidents = pd.read_sql("SELECT * FROM incident_reports", engine)
    plans = pd.read_sql("SELECT * FROM intervention_plans", engine)

    # Only assess active residents
    active = residents[residents["case_status"].str.strip().str.lower().isin({"active", "open"})].copy()
    print(f"  {len(active)} active residents to assess")

    rows = []
    for _, res in active.iterrows():
        rid = res["resident_id"]

        h_risk, h_reason = assess_health(rid, health)
        e_risk, e_reason = assess_education(rid, education)
        i_risk, i_reason = assess_incident(rid, incidents, plans, today)
        o_risk = overall_risk(h_risk, e_risk, i_risk)

        # Latest health snapshot values for display
        h_recs = health[health["resident_id"] == rid].copy()
        h_recs["record_date"] = pd.to_datetime(h_recs["record_date"], errors="coerce")
        h_recs = h_recs.sort_values("record_date")
        last_health = float(h_recs.iloc[-1]["general_health_score"]) if not h_recs.empty and "general_health_score" in h_recs.columns else None

        # Latest education snapshot values for display
        e_recs = education[education["resident_id"] == rid].copy()
        e_recs["record_date"] = pd.to_datetime(e_recs["record_date"], errors="coerce")
        e_recs = e_recs.sort_values("record_date")
        last_attendance = float(e_recs.iloc[-1]["attendance_rate"]) if not e_recs.empty and "attendance_rate" in e_recs.columns and pd.notna(e_recs.iloc[-1].get("attendance_rate")) else None
        last_progress = float(e_recs.iloc[-1]["progress_percent"]) if not e_recs.empty and "progress_percent" in e_recs.columns and pd.notna(e_recs.iloc[-1].get("progress_percent")) else None

        # Incident counts
        res_inc = incidents[incidents["resident_id"] == rid].copy()
        res_inc["incident_date"] = pd.to_datetime(res_inc["incident_date"], errors="coerce")
        inc_30 = int((res_inc["incident_date"] >= pd.Timestamp(today) - pd.Timedelta(days=30)).sum())
        inc_90 = int((res_inc["incident_date"] >= pd.Timestamp(today) - pd.Timedelta(days=90)).sum())

        # Most urgent active plan
        res_plans = plans[plans["resident_id"] == rid]
        active_plan = res_plans[~res_plans["status"].isin({"Achieved", "Closed"})]
        plan_status = active_plan.sort_values("target_date").iloc[0]["status"] if not active_plan.empty else None
        plan_target = str(active_plan.sort_values("target_date").iloc[0]["target_date"]) if not active_plan.empty and "target_date" in active_plan.columns else None

        rows.append({
            "resident_id":           rid,
            "case_control_no":       res.get("case_control_no"),
            "internal_code":         res.get("internal_code"),
            "safehouse_id":          res.get("safehouse_id"),
            "case_category":         res.get("case_category"),
            "current_risk_level":    res.get("current_risk_level"),
            "health_risk":           h_risk,
            "health_risk_reason":    h_reason,
            "education_risk":        e_risk,
            "education_risk_reason": e_reason,
            "incident_risk":         i_risk,
            "incident_risk_reason":  i_reason,
            "overall_risk":          o_risk,
            "last_health_score":     last_health,
            "last_attendance_rate":  last_attendance,
            "last_progress_percent": last_progress,
            "incidents_last_30d":    inc_30,
            "incidents_last_90d":    inc_90,
            "active_plan_status":    plan_status,
            "plan_target_date":      plan_target,
            "run_date":              today,
        })

    out = pd.DataFrame(rows)

    # Sort: High first, then Medium, then Low
    tier_order = {"High": 0, "Medium": 1, "Low": 2}
    out["_sort"] = out["overall_risk"].map(tier_order)
    out = out.sort_values("_sort").drop(columns=["_sort"]).reset_index(drop=True)

    out.to_sql("ml_resident_risk_predictions", engine, if_exists="replace", index=False)

    print(f"Done. Wrote {len(out)} rows to ml_resident_risk_predictions.")
    print(f"  Overall — High: {(out['overall_risk'] == 'High').sum()}  |  Medium: {(out['overall_risk'] == 'Medium').sum()}  |  Low: {(out['overall_risk'] == 'Low').sum()}")
    print(f"  Health  — High: {(out['health_risk'] == 'High').sum()}  |  Medium: {(out['health_risk'] == 'Medium').sum()}")
    print(f"  Education — High: {(out['education_risk'] == 'High').sum()}  |  Medium: {(out['education_risk'] == 'Medium').sum()}")
    print(f"  Incident  — High: {(out['incident_risk'] == 'High').sum()}  |  Medium: {(out['incident_risk'] == 'Medium').sum()}")


if __name__ == "__main__":
    main()
