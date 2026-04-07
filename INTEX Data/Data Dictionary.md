#  Appendix A: Data Dictionary

### Table Overview

| Table | Detail | Purpose |
| :---- | :---- | :---- |
| safehouses | One row per safehouse | Physical locations where girls are housed and served |
| partners | One row per partner | Organizations and individuals who deliver services |
| partner\_assignments | One row per partner × safehouse × program area | Which partners serve which safehouses and in what capacity |
| supporters | One row per donor/supporter | People and organizations who donate money, goods, time, skills, or advocacy |
| donations | One row per donation event | Individual donations across all types |
| in\_kind\_donation\_items | One row per line item | Item-level details for in-kind donations |
| donation\_allocations | One row per donation × safehouse × program area | How donation value is distributed across safehouses and program areas |
| residents | One row per resident | Case records for girls currently or formerly served |
| process\_recordings | One row per counseling session | Dated counseling session notes for each resident |
| home\_visitations | One row per home/field visit | Home and field visit records for residents and families |
| education\_records | One row per resident per month | Monthly education progress and attendance |
| health\_wellbeing\_records | One row per resident per month | Monthly physical health, nutrition, sleep, and energy |
| intervention\_plans | One row per intervention/goal | Individual intervention plans, goals, and services |
| incident\_reports | One row per incident | Individual safety and behavioral incident records |
| social\_media\_posts | One row per social media post | Organization social media activity, content, and engagement metrics (API-like schema) |
| safehouse\_monthly\_metrics | One row per safehouse per month | Aggregated monthly outcome metrics for each safehouse |
| public\_impact\_snapshots | One row per month | Anonymized aggregate impact reports for public/donor communication |

### safehouses

Safehouse locations operated by the organization.

| Field | Type | Description |
| :---- | :---- | :---- |
| safehouse\_id | integer | Primary key |
| safehouse\_code | string | Human-readable short code (e.g., SH-01) |
| name | string | Display name |
| region | string | One of: Luzon, Visayas, Mindanao |
| city | string | City of the safehouse |
| province | string | Province of the safehouse |
| country | string | Always Philippines |
| open\_date | date | Date the safehouse opened |
| status | string | Active or Inactive |
| capacity\_girls | integer | Maximum number of girls the facility can house |
| capacity\_staff | integer | Target on-site staff headcount |
| current\_occupancy | integer | Current number of girls housed |
| notes | string | Free-text notes |

### partners

Organizations and individuals contracted to deliver services (education, operations, transport, etc.).

| Field | Type | Description |
| :---- | :---- | :---- |
| partner\_id | integer | Primary key |
| partner\_name | string | Full name or organization name |
| partner\_type | string | Organization or Individual |
| role\_type | string | One of: Education, Evaluation, SafehouseOps, FindSafehouse, Logistics, Transport, Maintenance |
| contact\_name | string | Primary contact person |
| email | string | Contact email address |
| phone | string | Contact phone number |
| region | string | Primary region served |
| status | string | Active or Inactive |
| start\_date | date | Contract start date |
| end\_date | date | Contract end date; null if still active |
| notes | string | Free-text notes |

### partner\_assignments

Assignments of partners to safehouses and program areas.

| Field | Type | Description |
| :---- | :---- | :---- |
| assignment\_id | integer | Primary key |
| partner\_id | integer | FK → partners.partner\_id |
| safehouse\_id | integer | FK → safehouses.safehouse\_id (nullable) |
| program\_area | string | One of: Education, Wellbeing, Operations, Transport, Maintenance |
| assignment\_start | date | Assignment start date |
| assignment\_end | date | Assignment end date; null if active |
| responsibility\_notes | string | Description of the assignment |
| is\_primary | boolean | Whether this is the partner’s primary assignment |
| status | string | Active or Ended |

### supporters

Donors, volunteers, skilled contributors, and partner organizations that provide support.

| Field | Type | Description |
| :---- | :---- | :---- |
| supporter\_id | integer | Primary key |
| supporter\_type | string | One of: MonetaryDonor, InKindDonor, Volunteer, SkillsContributor, SocialMediaAdvocate, PartnerOrganization |
| display\_name | string | Name shown in communications |
| organization\_name | string | Organization name (null for individuals) |
| first\_name | string | First name (null for organizations) |
| last\_name | string | Last name (null for organizations) |
| relationship\_type | string | One of: Local, International, PartnerOrganization |
| region | string | Region of record |
| country | string | Country of the supporter |
| email | string | Contact email address |
| phone | string | Contact phone number |
| status | string | Active or Inactive |
| first\_donation\_date | date | Date of the supporter’s first donation (nullable) |
| acquisition\_channel | string | How the supporter first learned about the organization. One of: Website, SocialMedia, Event, WordOfMouth, PartnerReferral, Church |
| created\_at | datetime | When the supporter record was created |

### donations

Donation events across all donation types.

| Field | Type | Description |
| :---- | :---- | :---- |
| donation\_id | integer | Primary key |
| supporter\_id | integer | FK → supporters.supporter\_id |
| donation\_type | string | One of: Monetary, InKind, Time, Skills, SocialMedia |
| donation\_date | date | Date of the donation |
| channel\_source | string | One of: Campaign, Event, Direct, SocialMedia, PartnerReferral |
| currency\_code | string | PHP for monetary (in Philippine pesos); null otherwise |
| amount | decimal | Monetary amount; null for non-monetary |
| estimated\_value | decimal | Value in the unit given by impact\_unit |
| impact\_unit | string | One of: pesos, items, hours, campaigns |
| is\_recurring | boolean | Whether this donation is part of a recurring commitment |
| campaign\_name | string | Name of the fundraising campaign, if applicable (nullable). Examples: Year-End Hope, Back to School, Summer of Safety, GivingTuesday |
| notes | string | Free-text notes |
| created\_by\_partner\_id | integer | FK → partners.partner\_id (nullable) |
| referral\_post\_id | integer | FK → social\_media\_posts.post\_id (nullable). Populated for donations where channel\_source is SocialMedia, linking to the post that likely referred the donation |

### in\_kind\_donation\_items

Line-item details for in-kind donations.

| Field | Type | Description |
| :---- | :---- | :---- |
| item\_id | integer | Primary key |
| donation\_id | integer | FK → donations.donation\_id |
| item\_name | string | Item description |
| item\_category | string | One of: Food, Supplies, Clothing, SchoolMaterials, Hygiene, Furniture, Medical |
| quantity | integer | Quantity donated |
| unit\_of\_measure | string | One of: pcs, boxes, kg, sets, packs |
| estimated\_unit\_value | decimal | Estimated value per unit in Philippine pesos (PHP) |
| intended\_use | string | One of: Meals, Education, Shelter, Hygiene, Health |
| received\_condition | string | One of: New, Good, Fair |

### donation\_allocations

How donations are allocated across safehouses and program areas.

| Field | Type | Description |
| :---- | :---- | :---- |
| allocation\_id | integer | Primary key |
| donation\_id | integer | FK → donations.donation\_id |
| safehouse\_id | integer | FK → safehouses.safehouse\_id |
| program\_area | string | One of: Education, Wellbeing, Operations, Transport, Maintenance, Outreach |
| amount\_allocated | decimal | Allocated value in Philippine pesos (PHP) |
| allocation\_date | date | Date of allocation |
| allocation\_notes | string | Free-text notes |

### residents

Case records for girls currently or formerly served by the organization. This table is modeled after real caseload inventory documentation used by Philippine social welfare agencies.

| Field | Type | Description |
| :---- | :---- | :---- |
| resident\_id | integer | Primary key |
| case\_control\_no | string | Case control number (e.g., C0073) |
| internal\_code | string | Anonymized internal identifier |
| safehouse\_id | integer | FK → safehouses.safehouse\_id |
| case\_status | string | One of: Active, Closed, Transferred |
| sex | string | F (all residents in this program are female) |
| date\_of\_birth | date | Date of birth |
| birth\_status | string | One of: Marital, Non-Marital |
| place\_of\_birth | string | City/municipality of birth |
| religion | string | Religious affiliation |
| case\_category | string | One of: Abandoned, Foundling, Surrendered, Neglected |
| sub\_cat\_orphaned | boolean | Is the child orphaned? |
| sub\_cat\_trafficked | boolean | Is the child a trafficked child? |
| sub\_cat\_child\_labor | boolean | Is the child a victim of child labor? |
| sub\_cat\_physical\_abuse | boolean | Is the child a victim of physical abuse? |
| sub\_cat\_sexual\_abuse | boolean | Is the child a victim of sexual abuse? |
| sub\_cat\_osaec | boolean | Is the child a victim of OSAEC/CSAEM? |
| sub\_cat\_cicl | boolean | Is the child in conflict with the law (CICL)? |
| sub\_cat\_at\_risk | boolean | Is the child at risk (CAR)? |
| sub\_cat\_street\_child | boolean | Is the child in a street situation? |
| sub\_cat\_child\_with\_hiv | boolean | Is the child living with HIV? |
| is\_pwd | boolean | Is the child a person with a disability? |
| pwd\_type | string | Type of disability if applicable (nullable) |
| has\_special\_needs | boolean | Does the child have mental/health/developmental needs? |
| special\_needs\_diagnosis | string | Diagnosis/type if applicable (nullable) |
| family\_is\_4ps | boolean | Is the family a 4Ps (Pantawid Pamilyang Pilipino Program) beneficiary? |
| family\_solo\_parent | boolean | Is the parent a solo parent? |
| family\_indigenous | boolean | Is the family part of an indigenous group? |
| family\_parent\_pwd | boolean | Is the parent a person with a disability? |
| family\_informal\_settler | boolean | Is the family an informal settler or homeless? |
| date\_of\_admission | date | Date admitted to the safehouse |
| age\_upon\_admission | string | Age at admission (e.g., 13 Years 2 months), current data may not be calculated accurately. |
| present\_age | string | Current age as of reporting date, current data may not be calculated accurately |
| length\_of\_stay | string | Duration in the center (e.g., 3 Years 1 months), current data may not be calculated accurately |
| referral\_source | string | One of: Government Agency, NGO, Police, Self-Referral, Community, Court Order |
| referring\_agency\_person | string | Name of referring agency or person |
| date\_colb\_registered | date | Date Certificate of Live Birth (COLB) was registered (nullable) |
| date\_colb\_obtained | date | Date Certificate of Live Birth (COLB) was obtained from Local Civil Registry (LCR) or Philippine Statistics Authority (PSA) (nullable) |
| assigned\_social\_worker | string | Name(s) of assigned social worker(s) |
| initial\_case\_assessment | string | Initial assessment/plan (e.g., For Reunification, For Foster Care) |
| date\_case\_study\_prepared | date | Date the child case study report was prepared (nullable) |
| reintegration\_type | string | One of: Family Reunification, Foster Care, Adoption (Domestic), Adoption (Inter-Country), Independent Living, None (nullable) |
| reintegration\_status | string | One of: Not Started, In Progress, Completed, On Hold (nullable) |
| initial\_risk\_level | string | Risk level assessed at intake. One of: Low, Medium, High, Critical |
| current\_risk\_level | string | Most recently assessed risk level. One of: Low, Medium, High, Critical |
| date\_enrolled | date | Same as date\_of\_admission (for compatibility) |
| date\_closed | date | Date the case was closed; null if still open |
| created\_at | datetime | Record creation timestamp |
| notes\_restricted | string | Restricted-access free-text field |

### process\_recordings

Structured counseling session notes for each resident, following the “Process Recording” format used by Philippine social welfare practitioners. Each entry documents a dated interaction between a social worker and a resident, including observations, interventions, and follow-up actions.

| Field | Type | Description |
| :---- | :---- | :---- |
| recording\_id | integer | Primary key |
| resident\_id | integer | FK → residents.resident\_id |
| session\_date | date | Date of the counseling session |
| social\_worker | string | Name of the social worker conducting the session |
| session\_type | string | One of: Individual, Group |
| session\_duration\_minutes | integer | Duration of the session in minutes |
| emotional\_state\_observed | string | Emotional state at the start of the session. One of: Calm, Anxious, Sad, Angry, Hopeful, Withdrawn, Happy, Distressed |
| emotional\_state\_end | string | Emotional state at the end of the session. Same enum as emotional\_state\_observed |
| session\_narrative | string | Narrative summary of the session (what was discussed, what was observed) |
| interventions\_applied | string | Description of interventions or techniques used |
| follow\_up\_actions | string | Planned follow-up actions |
| progress\_noted | boolean | Whether progress was noted in this session |
| concerns\_flagged | boolean | Whether any concerns were flagged |
| referral\_made | boolean | Whether a referral was made to another professional (e.g., psychologist, legal) |
| notes\_restricted | string | Restricted-access free-text field |

### home\_visitations

Records of home and field visits conducted by social workers to the families or guardians of residents. Home visitations are a critical part of case assessment, reintegration planning, and post-placement monitoring.

| Field | Type | Description |
| :---- | :---- | :---- |
| visitation\_id | integer | Primary key |
| resident\_id | integer | FK → residents.resident\_id |
| visit\_date | date | Date of the visit |
| social\_worker | string | Name of the social worker who conducted the visit |
| visit\_type | string | One of: Initial Assessment, Routine Follow-Up, Reintegration Assessment, Post-Placement Monitoring, Emergency |
| location\_visited | string | Location or address visited |
| family\_members\_present | string | Description of who was present (e.g., “Mother and aunt”) |
| purpose | string | Purpose of the visit |
| observations | string | Narrative observations about the home environment and family |
| family\_cooperation\_level | string | One of: Highly Cooperative, Cooperative, Neutral, Uncooperative |
| safety\_concerns\_noted | boolean | Whether safety concerns were noted during the visit |
| follow\_up\_needed | boolean | Whether follow-up action is needed |
| follow\_up\_notes | string | Details of required follow-up (nullable) |
| visit\_outcome | string | One of: Favorable, Needs Improvement, Unfavorable, Inconclusive |

### education\_records

Monthly education progress records for each resident, tracking enrollment in educational programs, attendance, and academic progress.

| Field | Type | Description |
| :---- | :---- | :---- |
| education\_record\_id | integer | Primary key |
| resident\_id | integer | FK → residents.resident\_id |
| record\_date | date | Date of the record |
| program\_name | string | One of: Bridge Program, Secondary Support, Vocational Skills, Literacy Boost |
| course\_name | string | One of: Math, English, Science, Life Skills, Computer Basics, Livelihood |
| education\_level | string | One of: Primary, Secondary, Vocational, CollegePrep |
| attendance\_status | string | One of: Present, Late, Absent |
| attendance\_rate | decimal | Rolling attendance rate (0.0–1.0) |
| progress\_percent | decimal | Overall program progress (0–100) |
| completion\_status | string | One of: NotStarted, InProgress, Completed |
| gpa\_like\_score | decimal | Grade-like composite (1.0–5.0 scale) |
| notes | string | Free-text notes |

### health\_wellbeing\_records

Monthly physical health and wellbeing records for each resident, including medical, dental, and nutritional assessments.

| Field | Type | Description |
| :---- | :---- | :---- |
| health\_record\_id | integer | Primary key |
| resident\_id | integer | FK → residents.resident\_id |
| record\_date | date | Date of the record |
| weight\_kg | decimal | Body weight in kilograms |
| height\_cm | decimal | Height in centimeters |
| bmi | decimal | Body mass index |
| nutrition\_score | decimal | Nutrition quality score (1.0–5.0) |
| sleep\_score | decimal | Sleep quality score (1.0–5.0) |
| energy\_score | decimal | Daytime energy score (1.0–5.0) |
| general\_health\_score | decimal | Overall health score (1.0–5.0) |
| medical\_checkup\_done | boolean | Whether a medical check-up was conducted this period |
| dental\_checkup\_done | boolean | Whether a dental check-up was conducted this period |
| psychological\_checkup\_done | boolean | Whether a psychological check-up was conducted this period |
| medical\_notes\_restricted | string | Restricted-access free-text field |

### intervention\_plans

Individual intervention plans, goals, and services provided to each resident. Each plan represents a structured goal with a target area, description, and progress tracking. Plans are created during case conferences and updated during process recording sessions.

| Field | Type | Description |
| :---- | :---- | :---- |
| plan\_id | integer | Primary key |
| resident\_id | integer | FK → residents.resident\_id |
| plan\_category | string | One of: Safety, Psychosocial, Education, Physical Health, Legal, Reintegration |
| plan\_description | string | Description of the intervention or goal |
| services\_provided | string | Services provided (e.g., Caring, Healing, Teaching, Legal Services) |
| target\_value | decimal | Numeric target for the goal on the relevant scale (nullable) |
| target\_date | date | Target date for achievement |
| status | string | One of: Open, In Progress, Achieved, On Hold, Closed |
| case\_conference\_date | date | Date of the case conference where this plan was created/reviewed (nullable) |
| created\_at | datetime | Record creation timestamp |
| updated\_at | datetime | Last update timestamp |

### incident\_reports

Individual safety and behavioral incident records for residents. Each row represents a specific incident that was observed, reported, or documented by staff. Incident data provides granular detail beyond the monthly aggregate counts in safehouse\_monthly\_metrics.

| Field | Type | Description |
| :---- | :---- | :---- |
| incident\_id | integer | Primary key |
| resident\_id | integer | FK → residents.resident\_id |
| safehouse\_id | integer | FK → safehouses.safehouse\_id |
| incident\_date | date | Date of the incident |
| incident\_type | string | One of: Behavioral, Medical, Security, RunawayAttempt, SelfHarm, ConflictWithPeer, PropertyDamage |
| severity | string | One of: Low, Medium, High |
| description | string | Narrative description of the incident |
| response\_taken | string | Description of the staff response |
| resolved | boolean | Whether the incident has been resolved |
| resolution\_date | date | Date the incident was resolved (nullable) |
| reported\_by | string | Name of the staff member who reported the incident |
| follow\_up\_required | boolean | Whether follow-up action is required |

### social\_media\_posts

Records of the organization’s social media activity across platforms, modeled after the data available through platform APIs (Twitter/X, Facebook Graph, Instagram Insights, TikTok, LinkedIn, YouTube Data, WhatsApp Channels). Each row represents a single post with its content, metadata, and engagement metrics. Used to analyze social media effectiveness and its relationship to donor behavior.

| Field | Type | Description |
| :---- | :---- | :---- |
| post\_id | integer | Primary key |
| platform | string | One of: Facebook, Instagram, Twitter, TikTok, LinkedIn, YouTube, WhatsApp |
| platform\_post\_id | string | Simulated platform-native post ID (e.g., fb\_1234567890123456) |
| post\_url | string | Permalink URL to the post |
| created\_at | datetime | Full date and time the post was published (includes hour and minute) |
| day\_of\_week | string | Day of the week (e.g., Monday, Tuesday) |
| post\_hour | integer | Hour of the day the post was published (0–23) |
| post\_type | string | One of: ImpactStory, Campaign, EventPromotion, ThankYou, EducationalContent, FundraisingAppeal |
| media\_type | string | One of: Photo, Video, Carousel, Text, Reel |
| caption | string | Full text caption of the post |
| hashtags | string | Comma-separated list of hashtags used (e.g., \#EndTrafficking, \#HopeForGirls) |
| num\_hashtags | integer | Count of hashtags used |
| mentions\_count | integer | Number of @mentions in the post |
| has\_call\_to\_action | boolean | Whether the post includes a call to action |
| call\_to\_action\_type | string | One of: DonateNow, LearnMore, ShareStory, SignUp (nullable) |
| content\_topic | string | One of: Education, Health, Reintegration, DonorImpact, SafehouseLife, EventRecap, CampaignLaunch, Gratitude, AwarenessRaising |
| sentiment\_tone | string | One of: Hopeful, Urgent, Celebratory, Informative, Grateful, Emotional |
| caption\_length | integer | Character count of the caption |
| features\_resident\_story | boolean | Whether the post features a specific resident’s anonymized story |
| campaign\_name | string | Associated campaign name, if any (nullable). Uses the same campaign names as donations.campaign\_name |
| is\_boosted | boolean | Whether paid promotion was used for this post |
| boost\_budget\_php | decimal | Amount spent on paid promotion in Philippine pesos (PHP) (nullable; only populated if is\_boosted is true) |
| impressions | integer | Total number of times the post was displayed |
| reach | integer | Number of unique accounts that saw the post |
| likes | integer | Number of likes or reactions |
| comments | integer | Number of comments |
| shares | integer | Number of shares or retweets |
| saves | integer | Number of saves or bookmarks |
| click\_throughs | integer | Number of clicks to the organization’s website |
| video\_views | integer | Number of video views (nullable; only populated for Video and Reel media types) |
| engagement\_rate | decimal | Engagement rate: (likes \+ comments \+ shares) / reach |
| profile\_visits | integer | Number of profile visits attributed to this post |
| donation\_referrals | integer | Number of donations attributed to this post |
| estimated\_donation\_value\_php | decimal | Estimated total Philippine pesos (PHP) value of donations referred by this post |
| follower\_count\_at\_post | integer | Organization’s follower count on this platform at the time of posting |
| watch\_time\_seconds | integer | Total watch time in seconds across all viewers (nullable; only populated for YouTube posts) |
| avg\_view\_duration\_seconds | integer | Average number of seconds each viewer watched (nullable; only populated for YouTube posts) |
| subscriber\_count\_at\_post | integer | YouTube subscriber count at the time of posting (nullable; only populated for YouTube posts) |
| forwards | integer | Number of message forwards (nullable; only populated for WhatsApp posts). WhatsApp forwards represent personal referrals with high donation conversion rates |

### safehouse\_monthly\_metrics

Pre-aggregated monthly metrics for each safehouse.

| Field | Type | Description |
| :---- | :---- | :---- |
| metric\_id | integer | Primary key |
| safehouse\_id | integer | FK → safehouses.safehouse\_id |
| month\_start | date | First day of the month |
| month\_end | date | Last day of the month |
| active\_residents | integer | Number of residents assigned during the month |
| avg\_education\_progress | decimal | Mean education progress (0–100) |
| avg\_health\_score | decimal | Mean general health score (1.0–5.0) |
| process\_recording\_count | integer | Total process recording entries for the month |
| home\_visitation\_count | integer | Total home visitations conducted |
| incident\_count | integer | Total safety incidents recorded (from incident\_reports) |
| notes | string | Free-text notes |

### public\_impact\_snapshots

Monthly anonymized aggregate impact reports intended for public-facing dashboards and donor communications.

| Field | Type | Description |
| :---- | :---- | :---- |
| snapshot\_id | integer | Primary key |
| snapshot\_date | date | Month the snapshot represents |
| headline | string | Headline text for the snapshot |
| summary\_text | string | Short paragraph summary |
| metric\_payload\_json | string | JSON string of aggregated metrics |
| is\_published | boolean | Whether the snapshot has been published |
| published\_at | date | Publication date |

 

