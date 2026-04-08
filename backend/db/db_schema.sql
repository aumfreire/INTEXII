-- ============================================================
-- Lighthouse Sanctuary NGO — Schema DDL
-- SQL Server / ASP.NET compatible
-- ============================================================

-- Drop tables in reverse FK order
IF OBJECT_ID('process_recordings',        'U') IS NOT NULL DROP TABLE [process_recordings];
IF OBJECT_ID('intervention_plans',        'U') IS NOT NULL DROP TABLE [intervention_plans];
IF OBJECT_ID('incident_reports',          'U') IS NOT NULL DROP TABLE [incident_reports];
IF OBJECT_ID('home_visitations',          'U') IS NOT NULL DROP TABLE [home_visitations];
IF OBJECT_ID('health_wellbeing_records',  'U') IS NOT NULL DROP TABLE [health_wellbeing_records];
IF OBJECT_ID('education_records',         'U') IS NOT NULL DROP TABLE [education_records];
IF OBJECT_ID('public_impact_snapshots',   'U') IS NOT NULL DROP TABLE [public_impact_snapshots];
IF OBJECT_ID('safehouse_monthly_metrics', 'U') IS NOT NULL DROP TABLE [safehouse_monthly_metrics];
IF OBJECT_ID('partner_assignments',       'U') IS NOT NULL DROP TABLE [partner_assignments];
IF OBJECT_ID('in_kind_donation_items',    'U') IS NOT NULL DROP TABLE [in_kind_donation_items];
IF OBJECT_ID('donation_allocations',      'U') IS NOT NULL DROP TABLE [donation_allocations];
IF OBJECT_ID('donations',                 'U') IS NOT NULL DROP TABLE [donations];
IF OBJECT_ID('social_media_posts',        'U') IS NOT NULL DROP TABLE [social_media_posts];
IF OBJECT_ID('residents',                 'U') IS NOT NULL DROP TABLE [residents];
IF OBJECT_ID('supporters',                'U') IS NOT NULL DROP TABLE [supporters];
IF OBJECT_ID('partners',                  'U') IS NOT NULL DROP TABLE [partners];
IF OBJECT_ID('safehouses',                'U') IS NOT NULL DROP TABLE [safehouses];

CREATE TABLE [safehouses] (
    [safehouse_id]       INT PRIMARY KEY,
    [safehouse_code]     VARCHAR(10) NOT NULL,
    [name]               NVARCHAR(100) NOT NULL,
    [region]             NVARCHAR(50),
    [city]               NVARCHAR(100),
    [province]           NVARCHAR(100),
    [country]            NVARCHAR(50),
    [open_date]          DATE,
    [status]             NVARCHAR(20),
    [capacity_girls]     INT,
    [capacity_staff]     INT,
    [current_occupancy]  INT,
    [notes]              NVARCHAR(MAX)
);

CREATE TABLE [partners] (
    [partner_id]    INT PRIMARY KEY,
    [partner_name]  NVARCHAR(150) NOT NULL,
    [partner_type]  NVARCHAR(50),
    [role_type]     NVARCHAR(50),
    [contact_name]  NVARCHAR(150),
    [email]         NVARCHAR(150),
    [phone]         NVARCHAR(30),
    [region]        NVARCHAR(50),
    [status]        NVARCHAR(20),
    [start_date]    DATE,
    [end_date]      DATE,
    [notes]         NVARCHAR(MAX)
);

CREATE TABLE [supporters] (
    [supporter_id]        INT PRIMARY KEY,
    [supporter_type]      NVARCHAR(50),
    [display_name]        NVARCHAR(150),
    [organization_name]   NVARCHAR(150),
    [first_name]          NVARCHAR(100),
    [last_name]           NVARCHAR(100),
    [relationship_type]   NVARCHAR(50),
    [region]              NVARCHAR(50),
    [country]             NVARCHAR(50),
    [email]               NVARCHAR(150),
    [phone]               NVARCHAR(30),
    [status]              NVARCHAR(20),
    [created_at]          DATETIME,
    [first_donation_date] DATE,
    [acquisition_channel] NVARCHAR(50)
);

CREATE TABLE [residents] (
    [resident_id]               INT PRIMARY KEY,
    [case_control_no]           NVARCHAR(20),
    [internal_code]             NVARCHAR(20),
    [safehouse_id]              INT REFERENCES [safehouses]([safehouse_id]),
    [case_status]               NVARCHAR(20),
    [sex]                       NVARCHAR(5),
    [date_of_birth]             DATE,
    [birth_status]              NVARCHAR(20),
    [place_of_birth]            NVARCHAR(100),
    [religion]                  NVARCHAR(100),
    [case_category]             NVARCHAR(100),
    [sub_cat_orphaned]          BIT,
    [sub_cat_trafficked]        BIT,
    [sub_cat_child_labor]       BIT,
    [sub_cat_physical_abuse]    BIT,
    [sub_cat_sexual_abuse]      BIT,
    [sub_cat_osaec]             BIT,
    [sub_cat_cicl]              BIT,
    [sub_cat_at_risk]           BIT,
    [sub_cat_street_child]      BIT,
    [sub_cat_child_with_hiv]    BIT,
    [is_pwd]                    BIT,
    [pwd_type]                  NVARCHAR(100),
    [has_special_needs]         BIT,
    [special_needs_diagnosis]   NVARCHAR(200),
    [family_is_4ps]             BIT,
    [family_solo_parent]        BIT,
    [family_indigenous]         BIT,
    [family_parent_pwd]         BIT,
    [family_informal_settler]   BIT,
    [date_of_admission]         DATE,
    [age_upon_admission]        NVARCHAR(50),
    [present_age]               NVARCHAR(50),
    [length_of_stay]            NVARCHAR(50),
    [referral_source]           NVARCHAR(100),
    [referring_agency_person]   NVARCHAR(150),
    [date_colb_registered]      DATE,
    [date_colb_obtained]        DATE,
    [assigned_social_worker]    NVARCHAR(20),
    [initial_case_assessment]   NVARCHAR(200),
    [date_case_study_prepared]  DATE,
    [reintegration_type]        NVARCHAR(100),
    [reintegration_status]      NVARCHAR(50),
    [initial_risk_level]        NVARCHAR(20),
    [current_risk_level]        NVARCHAR(20),
    [date_enrolled]             DATE,
    [date_closed]               DATE,
    [created_at]                DATETIME,
    [notes_restricted]          NVARCHAR(MAX)
);

CREATE TABLE [social_media_posts] (
    [post_id]                       INT PRIMARY KEY,
    [platform]                      NVARCHAR(50),
    [platform_post_id]              NVARCHAR(100),
    [post_url]                      NVARCHAR(500),
    [created_at]                    DATETIME,
    [day_of_week]                   NVARCHAR(20),
    [post_hour]                     INT,
    [post_type]                     NVARCHAR(50),
    [media_type]                    NVARCHAR(50),
    [caption]                       NVARCHAR(MAX),
    [hashtags]                      NVARCHAR(MAX),
    [num_hashtags]                  INT,
    [mentions_count]                INT,
    [has_call_to_action]            BIT,
    [call_to_action_type]           NVARCHAR(100),
    [content_topic]                 NVARCHAR(100),
    [sentiment_tone]                NVARCHAR(50),
    [caption_length]                INT,
    [features_resident_story]       BIT,
    [campaign_name]                 NVARCHAR(150),
    [is_boosted]                    BIT,
    [boost_budget_php]              DECIMAL(12,2),
    [impressions]                   INT,
    [reach]                         INT,
    [likes]                         INT,
    [comments]                      INT,
    [shares]                        INT,
    [saves]                         INT,
    [click_throughs]                INT,
    [video_views]                   INT,
    [engagement_rate]               DECIMAL(8,4),
    [profile_visits]                INT,
    [donation_referrals]            INT,
    [estimated_donation_value_php]  DECIMAL(14,2),
    [follower_count_at_post]        INT,
    [watch_time_seconds]            INT,
    [avg_view_duration_seconds]     DECIMAL(8,2),
    [subscriber_count_at_post]      INT,
    [forwards]                      INT
);

CREATE TABLE [donations] (
    [donation_id]       INT PRIMARY KEY,
    [supporter_id]      INT REFERENCES [supporters]([supporter_id]),
    [donation_type]     NVARCHAR(50),
    [donation_date]     DATE,
    [is_recurring]      BIT,
    [campaign_name]     NVARCHAR(150),
    [channel_source]    NVARCHAR(100),
    [currency_code]     NVARCHAR(10),
    [amount]            DECIMAL(14,2),
    [estimated_value]   DECIMAL(14,2),
    [impact_unit]       NVARCHAR(50),
    [notes]             NVARCHAR(MAX),
    [referral_post_id]  INT REFERENCES [social_media_posts]([post_id])
);

CREATE TABLE [donation_allocations] (
    [allocation_id]      INT PRIMARY KEY,
    [donation_id]        INT REFERENCES [donations]([donation_id]),
    [safehouse_id]       INT REFERENCES [safehouses]([safehouse_id]),
    [program_area]       NVARCHAR(100),
    [amount_allocated]   DECIMAL(14,2),
    [allocation_date]    DATE,
    [allocation_notes]   NVARCHAR(MAX)
);

CREATE TABLE [in_kind_donation_items] (
    [item_id]                INT PRIMARY KEY,
    [donation_id]            INT REFERENCES [donations]([donation_id]),
    [item_name]              NVARCHAR(200),
    [item_category]          NVARCHAR(100),
    [quantity]               INT,
    [unit_of_measure]        NVARCHAR(50),
    [estimated_unit_value]   DECIMAL(12,2),
    [intended_use]           NVARCHAR(200),
    [received_condition]     NVARCHAR(50)
);

CREATE TABLE [partner_assignments] (
    [assignment_id]         INT PRIMARY KEY,
    [partner_id]            INT REFERENCES [partners]([partner_id]),
    [safehouse_id]          INT REFERENCES [safehouses]([safehouse_id]),
    [program_area]          NVARCHAR(100),
    [assignment_start]      DATE,
    [assignment_end]        DATE,
    [responsibility_notes]  NVARCHAR(MAX),
    [is_primary]            BIT,
    [status]                NVARCHAR(20)
);

CREATE TABLE [safehouse_monthly_metrics] (
    [metric_id]                  INT PRIMARY KEY,
    [safehouse_id]               INT REFERENCES [safehouses]([safehouse_id]),
    [month_start]                DATE,
    [month_end]                  DATE,
    [active_residents]           INT,
    [avg_education_progress]     DECIMAL(7,4),
    [avg_health_score]           DECIMAL(6,4),
    [process_recording_count]    INT,
    [home_visitation_count]      INT,
    [incident_count]             INT,
    [notes]                      NVARCHAR(MAX)
);

CREATE TABLE [public_impact_snapshots] (
    [snapshot_id]          INT PRIMARY KEY,
    [snapshot_date]        DATE,
    [headline]             NVARCHAR(300),
    [summary_text]         NVARCHAR(MAX),
    [metric_payload_json]  NVARCHAR(MAX),
    [is_published]         BIT,
    [published_at]         DATE
);

CREATE TABLE [education_records] (
    [education_record_id]  INT PRIMARY KEY,
    [resident_id]          INT REFERENCES [residents]([resident_id]),
    [record_date]          DATE,
    [education_level]      NVARCHAR(100),
    [school_name]          NVARCHAR(200),
    [enrollment_status]    NVARCHAR(50),
    [attendance_rate]      DECIMAL(6,4),
    [progress_percent]     DECIMAL(7,4),
    [completion_status]    NVARCHAR(50),
    [notes]                NVARCHAR(MAX)
);

CREATE TABLE [health_wellbeing_records] (
    [health_record_id]             INT PRIMARY KEY,
    [resident_id]                  INT REFERENCES [residents]([resident_id]),
    [record_date]                  DATE,
    [general_health_score]         DECIMAL(4,2),
    [nutrition_score]              DECIMAL(4,2),
    [sleep_quality_score]          DECIMAL(4,2),
    [energy_level_score]           DECIMAL(4,2),
    [height_cm]                    DECIMAL(6,2),
    [weight_kg]                    DECIMAL(6,2),
    [bmi]                          DECIMAL(5,2),
    [medical_checkup_done]         BIT,
    [dental_checkup_done]          BIT,
    [psychological_checkup_done]   BIT,
    [notes]                        NVARCHAR(MAX)
);

CREATE TABLE [home_visitations] (
    [visitation_id]            INT PRIMARY KEY,
    [resident_id]              INT REFERENCES [residents]([resident_id]),
    [visit_date]               DATE,
    [social_worker]            NVARCHAR(20),
    [visit_type]               NVARCHAR(100),
    [location_visited]         NVARCHAR(200),
    [family_members_present]   NVARCHAR(MAX),
    [purpose]                  NVARCHAR(MAX),
    [observations]             NVARCHAR(MAX),
    [family_cooperation_level] NVARCHAR(50),
    [safety_concerns_noted]    BIT,
    [follow_up_needed]         BIT,
    [follow_up_notes]          NVARCHAR(MAX),
    [visit_outcome]            NVARCHAR(100)
);

CREATE TABLE [incident_reports] (
    [incident_id]       INT PRIMARY KEY,
    [resident_id]       INT REFERENCES [residents]([resident_id]),
    [safehouse_id]      INT REFERENCES [safehouses]([safehouse_id]),
    [incident_date]     DATE,
    [incident_type]     NVARCHAR(100),
    [severity]          NVARCHAR(20),
    [description]       NVARCHAR(MAX),
    [response_taken]    NVARCHAR(MAX),
    [resolved]          BIT,
    [resolution_date]   DATE,
    [reported_by]       NVARCHAR(20),
    [follow_up_required] BIT
);

CREATE TABLE [intervention_plans] (
    [plan_id]               INT PRIMARY KEY,
    [resident_id]           INT REFERENCES [residents]([resident_id]),
    [plan_category]         NVARCHAR(100),
    [plan_description]      NVARCHAR(MAX),
    [services_provided]     NVARCHAR(MAX),
    [target_value]          DECIMAL(8,4),
    [target_date]           DATE,
    [status]                NVARCHAR(50),
    [case_conference_date]  DATE,
    [created_at]            DATETIME,
    [updated_at]            DATETIME
);

CREATE TABLE [process_recordings] (
    [recording_id]              INT PRIMARY KEY,
    [resident_id]               INT REFERENCES [residents]([resident_id]),
    [session_date]              DATE,
    [social_worker]             NVARCHAR(20),
    [session_type]              NVARCHAR(50),
    [session_duration_minutes]  INT,
    [emotional_state_observed]  NVARCHAR(100),
    [emotional_state_end]       NVARCHAR(100),
    [session_narrative]         NVARCHAR(MAX),
    [interventions_applied]     NVARCHAR(MAX),
    [follow_up_actions]         NVARCHAR(MAX),
    [progress_noted]            BIT,
    [concerns_flagged]          BIT,
    [referral_made]             BIT,
    [notes_restricted]          NVARCHAR(MAX)
);
