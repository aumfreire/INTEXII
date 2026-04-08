# INTEX Data — Project Overview

## Table of Contents

1. [Project Summary](#project-summary)
2. [Folder Structure](#folder-structure)
3. [Data Sources](#data-sources)
4. [Exploratory Data Analysis](#exploratory-data-analysis)
5. [ML Pipeline Portfolio](#ml-pipeline-portfolio)
   - [Pipeline Rankings](#pipeline-rankings)
   - [Tier 1 — High Confidence](#tier-1--high-confidence-deploy-immediately)
   - [Tier 2 — Solid Performance](#tier-2--solid-use-with-context)
   - [Tier 3 — Useful Signals](#tier-3--useful-signals-limited-by-data-size)
   - [Tier 4 — Directional](#tier-4--directional-supplement-with-judgment)
6. [Prediction Output Files](#prediction-output-files)
7. [How to Use This for Decision-Making](#how-to-use-this-for-decision-making)
8. [Technical Standards](#technical-standards)
9. [Future Considerations](#future-considerations)

---

## Project Summary

This project delivers a complete data analysis and machine learning suite for a nonprofit organization managing safehouses for at-risk youth. The goal is to turn raw operational data into actionable predictions that help staff make better, faster decisions across three domains:

- **Donor & Fundraising** — Retain supporters, optimize outreach, maximize donation impact.
- **Resident Care** — Identify at-risk residents early, improve counseling outcomes, track recovery progress.
- **Safehouse Operations** — Forecast facility-level outcomes, allocate resources proactively.

All pipelines are built to be **future-proof**: they handle missing data, schema changes, cold-start scenarios, and can be retrained on fresh data at any time.

---

## Folder Structure

```
INTEX Data/
├── PROJECT_OVERVIEW.md                  ← This file
│
├── *.csv                                ← Raw data tables (17 files)
│
├── INTEX_EDA_Correlations_Actionable.ipynb   ← Exploratory Data Analysis notebook
├── INTEX_EDA_and_ML_Pipeline.ipynb           ← Initial combined EDA + ML notebook
│
├── ml-pipelines/                        ← All ML pipeline notebooks (9 pipelines)
│   ├── donor_lapse_retention_pipeline.ipynb
│   ├── social_media_donor_engagement_pipeline.ipynb
│   ├── resident_incident_risk_pipeline.ipynb
│   ├── counseling_effectiveness_pipeline.ipynb
│   ├── outreach_donation_impact_pipeline.ipynb
│   ├── intervention_success_pipeline.ipynb
│   ├── safehouse_outcome_forecast_pipeline.ipynb
│   ├── resident_education_drop_risk_pipeline.ipynb
│   └── resident_health_decline_risk_pipeline.ipynb
│
└── predictions_*.csv                    ← Output prediction files (9 files)
    ├── predictions_supporter_lapse_risk.csv
    ├── predictions_social_media_donor_engagement.csv
    ├── predictions_resident_incident_next30d.csv
    ├── predictions_counseling_effectiveness.csv
    ├── predictions_outreach_posts.csv
    ├── predictions_intervention_success.csv
    ├── predictions_safehouse_next_month.csv
    ├── predictions_resident_edu_drop_next_month.csv
    └── predictions_resident_health_decline_next_month.csv
```

---

## Data Sources

| File | Description | Rows | Key Fields |
|------|-------------|------|------------|
| `residents.csv` | Core resident case records | 60 | Demographics, risk levels, case status, subcategories, family context |
| `safehouses.csv` | Safehouse facility details | 9 | Location, region, capacity |
| `incident_reports.csv` | Safety and behavioral incidents | 100 | Severity, resolution, follow-up |
| `home_visitations.csv` | Home and field visit records | 1,337 | Visit type, outcome, family cooperation |
| `process_recordings.csv` | Counseling session notes | 2,819 | Emotional states, session type, interventions applied |
| `education_records.csv` | Monthly education progress | 3,470 | Attendance, progress percent, program level |
| `health_wellbeing_records.csv` | Monthly health records | 3,463 | General health, nutrition, sleep, energy scores |
| `intervention_plans.csv` | Individual intervention plans | 180 | Category, target, status, services provided |
| `donations.csv` | Donation transactions | 420 | Amount, type, channel, recurring status |
| `donation_allocations.csv` | How donations are distributed | 500+ | Safehouse, program area, amount |
| `supporters.csv` | Supporter/donor profiles | 60 | Type, region, acquisition channel |
| `social_media_posts.csv` | Social media content and metrics | 812 | Platform, topic, CTA, engagement rate, referrals |
| `partner_assignments.csv` | Partner-to-safehouse assignments | 48 | Program area, role |
| `partners.csv` | Partner organization details | 30 | Type, role |
| `safehouse_monthly_metrics.csv` | Aggregated monthly safehouse outcomes | 405 | Education, health, incident averages |
| `in_kind_donation_items.csv` | Non-monetary donation items | 129 | Category, condition, intended use |
| `public_impact_snapshots.csv` | Public-facing impact metrics | — | Aggregate stats |

---

## Exploratory Data Analysis

### `INTEX_EDA_Correlations_Actionable.ipynb`

A comprehensive, standalone EDA notebook that profiles every dataset and surfaces actionable insights. Key sections:

- **Data Profiling** — Data types, missing values, unique value counts, and descriptive statistics for every table.
- **Correlation Analysis** — Numeric correlation matrices with heatmaps for resident outcomes, safehouse metrics, and donation patterns.
- **Safehouse Comparisons** — Side-by-side performance across all 9 safehouses on education, health, and incident metrics, identifying top and bottom performers.
- **Regional Breakdowns** — How outcomes vary by region, highlighting geographic disparities.
- **Donor & Social Media Insights** — Which platforms, content topics, and CTAs drive the most engagement and donation referrals.
- **Temporal Trends** — Month-over-month patterns in admissions, donations, incidents, and social media activity.
- **Actionable Recommendations** — Each section concludes with specific suggestions the nonprofit can act on immediately.

### `INTEX_EDA_and_ML_Pipeline.ipynb`

The initial combined notebook that performs broad EDA across all tables and includes a general-purpose risk classification model. Serves as a reference for the overall data landscape.

---

## ML Pipeline Portfolio

### Pipeline Rankings

All pipelines were validated using an **80/20 train/test split** across **3 random seeds** (42, 123, 7) to confirm stability and scalability.

| Rank | Pipeline | Metric | Mean Score | Stability (Std) | Training Size | Tier |
|:----:|----------|--------|:----------:|:----------------:|:-------------:|:----:|
| 1 | Donor Lapse / Retention | ROC-AUC | **0.855** | 0.015 | 1,497 | High Confidence |
| 2 | SM Donor Engagement | ROC-AUC | **0.815** | 0.019 | 1,497 | High Confidence |
| 3 | Resident Incident Risk | ROC-AUC | **0.795** | 0.024 | 1,696 | High Confidence |
| 4 | Counseling Effectiveness | R² | **0.668** | 0.016 | 2,255 | Solid |
| 5 | Outreach Donation Impact | R² | **0.569** | 0.023 | 649 | Solid |
| 6 | Intervention Success | ROC-AUC | **0.494** | 0.139 | 144 | Useful Signals |
| 7 | Safehouse Outcome Forecast | R² | **0.413** | 0.045 | 324 | Useful Signals |
| 8 | Education Progress Delta | R² | **0.115** | 0.007 | 2,776 | Directional |
| 9 | Health Score Delta | R² | **0.113** | 0.032 | 2,770 | Directional |

> **How to read this table:**
> - **ROC-AUC** measures classification accuracy (1.0 = perfect, 0.5 = random guessing).
> - **R²** measures how much variance the model explains (1.0 = perfect, 0.0 = no predictive power).
> - **Stability (Std)** shows how much the score varies across different random data splits. Lower is better.

---

### Tier 1 — High Confidence, Deploy Immediately

#### 1. Donor Lapse / Retention

| | |
|---|---|
| **Notebook** | `ml-pipelines/donor_lapse_retention_pipeline.ipynb` |
| **Output** | `predictions_supporter_lapse_risk.csv` |
| **Predicts** | Which supporters are at risk of stopping donations in the next 90 days |
| **Accuracy** | ROC-AUC 0.855, extremely stable (std 0.015) |
| **Dataset** | 1,872 supporter-quarter snapshots |

**Why it works:** Rich RFM (Recency, Frequency, Monetary) features combined with donation channel and type patterns give the model strong behavioral signals.

**Output columns:** `supporter_id`, `display_name`, `email`, `supporter_type`, `region`, `country`, `pred_will_donate_next_90d_proba`, `recency_days`, `frequency`, `value_sum`, `top_channel_source`, `top_donation_type`

**Recommended actions:**
- Supporters with lapse probability **> 0.6**: send personalized re-engagement emails within 2 weeks.
- High-value supporters approaching lapse: assign a relationship manager for a direct phone call.
- Use `top_channel_source` and `top_donation_type` to tailor outreach (if they came through social media, use that channel; if they gave in-kind, don't ask for cash).
- Run **monthly** to catch drift early.

---

#### 2. Social Media Donor Engagement

| | |
|---|---|
| **Notebook** | `ml-pipelines/social_media_donor_engagement_pipeline.ipynb` |
| **Output** | `predictions_social_media_donor_engagement.csv` |
| **Predicts** | Which supporters are likely to donate in the next 90 days, driven by social media content preferences |
| **Accuracy** | ROC-AUC 0.815, stable (std 0.019) |
| **Dataset** | 1,872 supporter-quarter snapshots |

**Why it works:** Combines traditional donor RFM features with social media affinity metrics (preferred platform, preferred content topic, preferred CTA, referral-linked donation history), creating a profile of what content moves each supporter to give.

**Output columns:** `supporter_id`, `display_name`, `email`, `engagement_tier` (High/Medium/Low), `engagement_probability`, `suggested_action`, `preferred_platform`, `preferred_topic`, `preferred_cta`, `recency_days`, `donation_frequency`, `donation_value_sum`

**Recommended actions:**
- Use the **High-tier list** to time social media campaigns — post content matching their preferred topic and CTA.
- For **Medium-tier** supporters, follow the `suggested_action` column for personalized recommendations.
- Aggregate `preferred_topic` and `preferred_cta` across all high-probability supporters to guide the content calendar.
- Cross-reference with Donor Lapse: supporters flagged as both "likely to engage" and "at risk of lapsing" are the highest-priority targets.
- Run **monthly** alongside the Donor Lapse pipeline.

---

#### 3. Resident Incident Risk

| | |
|---|---|
| **Notebook** | `ml-pipelines/resident_incident_risk_pipeline.ipynb` |
| **Output** | `predictions_resident_incident_next30d.csv` |
| **Predicts** | Probability of a behavioral or safety incident in the next 30 days |
| **Accuracy** | ROC-AUC 0.795, stable (std 0.024) |
| **Dataset** | 2,120 resident-month snapshots |

**Why it works:** Time-aware features built from 90-day windows of incidents, counseling sessions, and home visits, enriched with resident subcategory and family context flags.

**Output columns:** `resident_id`, `name`, `safehouse_code`, `assigned_social_worker`, `pred_incident_next_30d_proba`, `incidents_past_90d`, `sessions_past_90d`, `visits_past_90d`, `current_risk_level`, `initial_risk_level`, `case_status`

**Recommended actions:**
- Residents with probability **> 0.10**: flag their assigned social worker for a proactive check-in within the week.
- Cross-reference with `sessions_past_90d` — a high-risk resident with few recent sessions has a gap to fill.
- Safehouse managers: group by safehouse and count high-risk residents to decide where to allocate extra staff.
- Run **weekly or bi-weekly** so interventions happen before incidents, not after.

---

### Tier 2 — Solid, Use with Context

#### 4. Counseling Effectiveness

| | |
|---|---|
| **Notebook** | `ml-pipelines/counseling_effectiveness_pipeline.ipynb` |
| **Output** | `predictions_counseling_effectiveness.csv` |
| **Predicts** | Expected emotional improvement from a counseling session |
| **Accuracy** | R² 0.668, very stable (std 0.016) |
| **Dataset** | 2,819 counseling sessions |

**Why it works:** The emotional state at session start, combined with session type, duration, and recent resident context (incidents, prior sessions), explains two-thirds of the variance in emotional outcomes.

**Output columns:** `resident_id`, `name`, `safehouse_code`, `session_date`, `emotional_state_observed`, `session_type`, `pred_emo_improvement`, `incidents_last_30d`, `prior_sessions_30d`, `current_risk_level`

**Recommended actions:**
- Use the **Best Practices Analysis** (included in the notebook output) to guide scheduling — it shows which session types produce the best outcomes for each starting emotional state.
- If predicted improvement is **low (< 0.5)**, consider changing the session format or increasing frequency.
- Track actual vs. predicted improvement to identify counselors who consistently outperform the model — study and share their techniques.
- Run **after each batch of sessions** or monthly.

---

#### 5. Outreach Donation Impact

| | |
|---|---|
| **Notebook** | `ml-pipelines/outreach_donation_impact_pipeline.ipynb` |
| **Output** | `predictions_outreach_posts.csv` |
| **Predicts** | Estimated donation value (PHP) a social media post will generate |
| **Accuracy** | R² 0.569, stable (std 0.023) |
| **Dataset** | 812 social media posts |

**Why it works:** Post attributes (platform, content type, topic, CTA, sentiment, boosted status, timing) have a measurable relationship with donation outcomes.

**Output columns:** `post_id`, `platform`, `post_type`, `content_topic`, `created_at`, `pred_estimated_donation_value_php`, `donation_referrals`, `estimated_donation_value_php`

**Recommended actions:**
- Before publishing, **score draft posts** through the model to compare predicted value. Adjust CTA, topic, or timing if the prediction is below average.
- Sort historical posts by predicted vs. actual value — posts that overperform reveal successful content patterns to replicate.
- Use feature importances (visible in the notebook) to set defaults for fundraising posts.
- **A/B test** the model's recommendations: one "optimized" post vs. one standard post per week.
- Run **before each campaign**.

---

### Tier 3 — Useful Signals, Limited by Data Size

#### 6. Intervention Success

| | |
|---|---|
| **Notebook** | `ml-pipelines/intervention_success_pipeline.ipynb` |
| **Output** | `predictions_intervention_success.csv` |
| **Predicts** | Whether an intervention plan will be marked "Achieved" |
| **Accuracy** | ROC-AUC 0.494, unstable (std 0.139) |
| **Dataset** | 180 completed plans |

**Why it's limited:** Only 180 completed plans is too few for a reliable classification model. Performance varies significantly across data splits.

**Output columns:** `plan_id`, `resident_id`, `name`, `safehouse_code`, `plan_category`, `status`, `prediction_tier` (Likely to Succeed / Moderate / At Risk), `pred_success_probability`, `n_services`, `days_to_target`

**Recommended actions:**
- Use the **"At Risk" tier as a discussion prompt** in case review meetings, not as a definitive judgment.
- The feature importances still reveal useful patterns (e.g., plans with more services score higher) even when overall accuracy is low.
- **Retrain quarterly** as more plans complete — this pipeline will improve significantly with more data.

---

#### 7. Safehouse Outcome Forecast

| | |
|---|---|
| **Notebook** | `ml-pipelines/safehouse_outcome_forecast_pipeline.ipynb` |
| **Output** | `predictions_safehouse_next_month.csv` |
| **Predicts** | Next-month education progress, health scores, and incident counts per safehouse |
| **Accuracy** | R² 0.413, moderately stable (std 0.045) |
| **Dataset** | 324 safehouse-month records |

**Why it's limited:** Only 9 safehouses with ~36 months of data constrains the model. Directional signals are still valuable for planning.

**Output columns:** `safehouse_id`, `safehouse_code`, `name`, `region`, `month_start`, `pred_avg_education_progress`, `pred_avg_health_score`, `pred_incident_count`

**Recommended actions:**
- If a safehouse's predicted incidents are rising while education is falling, **flag for a site visit**.
- Compare predictions to actuals monthly — consistent underperformance may indicate hidden issues.
- Use funding-related feature importances to support **budget allocation decisions**.
- Run **monthly**.

---

### Tier 4 — Directional, Supplement with Judgment

#### 8. Education Progress Delta

| | |
|---|---|
| **Notebook** | `ml-pipelines/resident_education_drop_risk_pipeline.ipynb` |
| **Output** | `predictions_resident_edu_drop_next_month.csv` |
| **Predicts** | Expected month-over-month change in a resident's education progress |
| **Accuracy** | R² 0.115, very stable (std 0.007) |
| **Dataset** | 3,470 education records |

**Why it's limited:** Education progress depends heavily on unmeasured factors (individual motivation, teacher quality, curriculum). The model captures only ~12% of the variance, but its stability means the signal it does find is consistent.

**Output columns:** `resident_id`, `name`, `safehouse_code`, `month_start`, `pred_edu_delta_next`, `high_risk_flag`, `edu_progress`, `edu_attendance`, `current_risk_level`

**Recommended actions:**
- Treat `high_risk_flag` as a **soft alert** — it warrants a conversation, not an automatic intervention.
- Combine with Counseling Effectiveness: a resident flagged here AND showing low emotional improvement is a stronger signal than either alone.
- The feature importances identify controllable levers (attendance, session frequency) even though overall R² is low.

---

#### 9. Health Score Delta

| | |
|---|---|
| **Notebook** | `ml-pipelines/resident_health_decline_risk_pipeline.ipynb` |
| **Output** | `predictions_resident_health_decline_next_month.csv` |
| **Predicts** | Expected month-over-month change in a resident's general health score |
| **Accuracy** | R² 0.113, moderate stability (std 0.032) |
| **Dataset** | 3,463 health records |

**Why it's limited:** Health changes are driven by factors outside the dataset (illness, seasonal effects, individual biology). Similar constraints to the education pipeline.

**Output columns:** `resident_id`, `name`, `safehouse_code`, `month_start`, `pred_health_delta_next`, `high_risk_flag`, `health_general`, `health_nutrition`, `health_sleep`, `health_energy`, `current_risk_level`

**Recommended actions:**
- Use as an **early-warning supplement** to regular health check-ups, not a replacement.
- If flagged AND nutrition/sleep sub-scores are trending down, prioritize a medical review.
- Feature importances reinforce that rapid incident response benefits physical wellbeing, not just safety.

---

## Prediction Output Files

All prediction CSVs are saved to the project root and include human-readable names (resident names, supporter names, safehouse names) so they can be used directly without needing to look up IDs.

| File | Pipeline | Rows | Key Prediction Column |
|------|----------|:----:|----------------------|
| `predictions_supporter_lapse_risk.csv` | Donor Lapse | 59 | `pred_will_donate_next_90d_proba` |
| `predictions_social_media_donor_engagement.csv` | SM Donor Engagement | 59 | `engagement_probability`, `engagement_tier` |
| `predictions_resident_incident_next30d.csv` | Incident Risk | 60 | `pred_incident_next_30d_proba` |
| `predictions_counseling_effectiveness.csv` | Counseling Effectiveness | 60 | `pred_emo_improvement` |
| `predictions_outreach_posts.csv` | Outreach Donation Impact | 812 | `pred_estimated_donation_value_php` |
| `predictions_intervention_success.csv` | Intervention Success | 148 | `pred_success_probability`, `prediction_tier` |
| `predictions_safehouse_next_month.csv` | Safehouse Forecast | 9 | `pred_avg_education_progress`, `pred_avg_health_score`, `pred_incident_count` |
| `predictions_resident_edu_drop_next_month.csv` | Education Delta | 60 | `pred_edu_delta_next`, `high_risk_flag` |
| `predictions_resident_health_decline_next_month.csv` | Health Delta | 60 | `pred_health_delta_next`, `high_risk_flag` |

---

## How to Use This for Decision-Making

### Quick Reference: Who Needs What

| Role | Pipelines to Review | Frequency |
|------|-------------------|-----------|
| **Executive Director** | Safehouse Outcome Forecast, Donor Lapse | Monthly |
| **Fundraising Team** | Donor Lapse, SM Donor Engagement | Monthly |
| **Marketing / Communications** | SM Donor Engagement, Outreach Donation Impact | Before each campaign |
| **Safehouse Managers** | Incident Risk, Safehouse Forecast | Weekly |
| **Social Workers** | Incident Risk, Education Delta, Health Delta | Weekly |
| **Program Director** | Counseling Effectiveness, Intervention Success | Monthly |
| **Education Coordinators** | Education Delta | Monthly |
| **Health / Wellbeing Staff** | Health Delta | Monthly |

### Combining Predictions for Stronger Signals

The most powerful insights come from **cross-referencing multiple pipelines**:

1. **Donor Lapse + SM Engagement** — A supporter flagged as "likely to lapse" AND "high engagement tier" is the single most important person to reach out to. They're reachable but drifting.

2. **Incident Risk + Counseling Effectiveness** — A resident with high incident probability but low predicted emotional improvement from recent sessions may need a different counseling approach entirely.

3. **Education Delta + Health Delta + Incident Risk** — A resident flagged across all three is showing systemic decline. Escalate to the program director for a comprehensive case review.

4. **Safehouse Forecast + Intervention Success** — If a safehouse is forecasted to see rising incidents AND its active intervention plans are rated "At Risk," that facility needs immediate attention.

---

## Technical Standards

Every pipeline follows the same engineering practices:

- **Preprocessing:** `StandardScaler` on all numeric features, `OneHotEncoder` on categoricals, `SimpleImputer` for missing values.
- **Model comparison:** Each pipeline trains at least two models (typically Ridge/RandomForest for regression, LogisticRegression/RandomForest for classification) and selects the best via cross-validation.
- **Cross-validation:** 5-fold CV (stratified for classification tasks) ensures the reported scores reflect generalized performance, not overfitting.
- **Stability testing:** All pipelines passed an 80/20 train/test split stability test across 3 random seeds.
- **Class imbalance handling:** Classification pipelines use `class_weight="balanced"` and report PR-AUC alongside ROC-AUC.
- **Time awareness:** Resident-level pipelines use past-window features and future-window labels to prevent data leakage.
- **Future-proof design:** Robust data loading (auto-detects file locations), graceful handling of missing columns, and retrainable on fresh data without code changes.

---

## Future Considerations

### Improving Accuracy Over Time

- **More data is the biggest lever.** The Intervention Success pipeline (currently 180 rows) and Safehouse Forecast (324 rows) will improve substantially as the database grows. Retrain quarterly.
- **The Education and Health Delta pipelines (R² ~0.11)** are limited by unmeasured factors. Adding qualitative data (teacher assessments, doctor notes) or external data (weather, school calendars) could help, but these may not be feasible to collect.

### Web App Integration

When deploying to the ASP.NET / React application:

- All prediction CSVs use **clean column names** (snake_case, no special characters) ready for API consumption.
- Tier columns (`engagement_tier`, `prediction_tier`, `high_risk_flag`) are designed for **frontend filtering and color-coding**.
- Probability columns are raw floats (0–1) suitable for **sorting, thresholding, and visualization**.
- Consider serving predictions via a REST API that reads from these CSVs (or a database populated from them) and refreshes on a schedule matching the recommended frequencies above.

### Pipelines Not Built (and Why)

| Candidate | Reason Not Built |
|-----------|-----------------|
| Home Visitation Outcome | ROC-AUC 0.517 — no predictive signal before visits occur |
| Incident Resolution Speed | Only 71 resolved incidents — too few rows |
| Reintegration Readiness | Only 60 residents with reintegration data — too few rows |
| Social Media Engagement Rate | R² 0.698 but overlaps with Outreach Donation Impact (same features, different target) |
