# Context  

Your client recently heard a presentation by the founders of [Lighthouse Sanctuary](https://www.lighthousesanctuary.org/), a US-based 501(c)(3) nonprofit that operates safe homes for girls who are survivors of sexual abuse or sex trafficking in the Philippines. Lighthouse Sanctuary contracts with in-country individuals and organizations to provide safehouses and rehabilitation services and is funded from local and international donors.

Inspired by the amazing good being performed by Lighthouse Sanctuary, your client has decided to create a similar organization to assist in other regions that are lacking similar services. Fortunately, Lighthouse Sanctuary has graciously shared anonymized information about their operations to help your client understand the day-to-day operations of the organization. This includes sample operational documentation such as caseload inventory records, process recording formats (structured counseling session notes), home visitation reports, and annual accomplishment report templates. Your role is to help your client develop the technology resources needed to effectively run the new organization and to help the client understand how to collect and utilize data (like that shared by Lighthouse) to drive business decisions.

The client is engaging your services so that they can meet the following primary goals before launch:

*  The organization depends entirely on donations to operate, and the founders are constantly worried about **donor retention and growth**. They lose donors and don’t always understand why. They run fundraising campaigns but aren’t sure which ones actually move the needle versus just generating noise. They want to know which donors might give more if asked, which ones are at risk of lapsing, and how to personalize outreach without a dedicated marketing team. They also want to communicate to donors specifically how their generosity is benefiting the residents, but they don’t have a good way to connect donation activity to outcomes.  
* The organization’s primary operational work is protecting and rehabilitating victims. The founders worry about **girls falling through the cracks**. With limited staff managing multiple safehouses, they need to know which girls are progressing and which are struggling, which interventions are actually working, and when a resident might be ready for reintegration or at risk of regression. They need a system to help them manage cases across the full lifecycle, from intake and case assessment through counseling, education, health services, and ultimately reintegration or placement. This includes structured counseling session documentation (process recordings), home visitation tracking, case conferences, and intervention planning.  
* Social media is the organization’s primary channel for reaching potential donors, but the founders freely admit they are **not experienced with social media**. They struggle with basic questions: What should they post? On which platforms? How often? What time of day? What kind of content actually leads to donations versus just generating likes? They have been posting sporadically and want to be more strategic, but they don’t have a marketing team and can’t afford to hire one. They need the technology to help them make smarter decisions about their social media presence and understand what is actually working.  
* The organization needs to be able to **administer** and maintain any systems with limited staff. It needs to be easy to create, update, and (carefully) remove data from the system.  
* All of this needs to be done using secure systems that **protect the privacy and safety** of victims, employees, donors, and partners. Given the extremely sensitive nature of the data — involving minors who are abuse survivors — privacy and data protection are paramount.

Your first order of business is recommending a name for this new organization.

# Dataset 

The data for the project is provided at the following link:

* [https://drive.google.com/file/d/1Dl8AcS1ydbHKL6PU0gP6tbUPqhPsUeXZ/view?usp=sharing](https://drive.google.com/file/d/1Dl8AcS1ydbHKL6PU0gP6tbUPqhPsUeXZ/view?usp=sharing) 

The dataset includes 17 tables that are available as 17 CSV files. You are also provided a data dictionary (see Appendix A) explaining the tables and fields. These tables and fields represent what Lighthouse Sanctuary has been keeping track of and your client’s new organization will need to track similar data. However, you may think of additional tables and fields to add to the database that you believe would be useful and you don’t have to use all of the existing data. You can modify the data as needed to meet the needs of the project.

The dataset is organized into three main domains:

**Donor and Support Domain** — Tables tracking safehouses, partners, supporters, donations (monetary, in-kind, time, skills, and social media advocacy), and donation allocations. These tables support the donor-facing and administrative features of the application.

**Case Management Domain** — Tables tracking residents (the girls served by the organization), their case information, process recordings (counseling sessions), home visitations, education records, health and wellbeing records, intervention plans, and incident reports. These tables support the core operational case management features of the application.

**Outreach and Communication Domain** — Tables tracking social media activity, engagement metrics, and public impact snapshots. These tables support the organization’s social media strategy and public-facing communications.

# Deliverables 

## IS 401 – Project Management and Systems Design 

You will complete this project in four one-day sprints (ending at midnight on Monday, Tuesday, Wednesday, and Thursday), with your final deliverable and presentation due on Friday. Each day has specific deliverables for this class. You will get half of the points simply for completing each step, and the other half of points will be awarded based on the quality of your submission. 

Make a copy of this [Figjam board](https://www.figma.com/board/8pD0922ice8zpZLfGuZNlc/2026W-INTEX-Figma-template?node-id=8405-285&t=Zk9u5jKTpRD5si4k-1) and submit the link through IS 401’s Learning Suite on Monday. Fill it out throughout the week. Each day’s section is due by 11:59pm that night. 

### Monday — Requirements (6.5 pts) 

Focus on understanding the problem and planning your work. 

* **Roles**: Identify a Scrum Master and Product Owner for the team.    
* **Customer personas**: Create two realistic personas that represent your two most important target users. Justify why these are the most important people to solve for. You should use these throughout the week to guide your decisions.   
* **Journey map**: Show the key steps users take today and identify their pain points.    
* **Problem statement**: Clearly describe the specific problem your product will solve.    
* **MoSCoW table**: List every requirement for INTEX in a MoSCoW table, along with at least five “nice-to-have” ideas your team comes up with. You should use this throughout the week to guide you as you prioritize your product backlog. Identify one feature you chose NOT to build and why.   
* **Product backlog**: Include a clear product goal and at least 12 backlog cards.    
* **Sprint “Monday” backlog**: Define a sprint goal and include at least 8 cards, each with a point estimate and exactly one person assigned. Take a screenshot of this before you start your Monday work.   
* **Burndown chart**: Set up a burndown chart that will track all your progress throughout the week. You should refer to this throughout the week to see if you’re on track.    
* **Figma wireframe**: Brainstorm with your team how you would design the 3 most important screens for your design. Draw a wireframe for each one in Desktop view.   

###  Tuesday — Design (4 pts) 

Focus on exploring design options and deciding what to build. 

* **Sprint “Tuesday” backlog**: Define a sprint goal and include at least 8 cards, each with a point estimate and exactly one person assigned. Take a screenshot of this before you start your Tuesday work.    
* **AI-generated UI options**: Provide 3 screenshots of each of 3 different UI designs (9 screenshots total). Include 5 questions you asked AI about each of the 3 different UI designs and summarize in a sentence or two the takeaways from the feedback on each design.    
* **Design decision**: Indicate which UI you chose. Write a short paragraph justifying why you chose it. List three changes you made to the original AI output.    
* **Tech stack diagram**: Draw a diagram showing the logos for each of your chosen technologies for the frontend, backend, and database.  

###  Wednesday — One working page (4.5 pts) 

Focus on getting a real feature working end-to-end. 

* **Sprint “Wednesday” backlog**: Define a sprint goal and include at least 8 cards, each with a point estimate and exactly one person assigned. Take a screenshot of this before you start your Wednesday work.    
* **Current state screenshots**: Show a screenshot of at least 5 pages, in both desktop and mobile views.    
* **One working page**: Demonstrate one page that is deployed to the cloud and persists data in the database.    
* **User feedback**: Show your website in its current state to a real person. Choose someone who would have some insight on your target persona. Watch them use the site, listen to their feedback, and write down 5 specific things you plan to change based on what they share.    
* **Burndown chart**: Share your up-to-date burndown chart to reflect your progress so far during the week.  

 

### Thursday — Iterate (5 pts) 

Focus on finalizing your product and adding measurement. 

* **Sprint “Thursday” backlog**: Define a sprint goal and include at least 8 cards, each with a point estimate and exactly one person assigned. Take a screenshot of this before you start your Thursday work.    
* **OKR metric**: Track and display one meaningful metric in your app and explain why it is the most important measure of success for your product.    
* **Accessibility**: Achieve a Lighthouse accessibility score of at least 90% on every page.    
* **Responsiveness**: Ensure every page resizes appropriately for desktop and mobile views.   
* **Retrospective**: Conduct a retrospective. Each person should write at least 2 things that are going well, 2 things that could have been better, and their personal greatest contribution to their team this week. Then reflect as a team on how well your solution solves the customer problem you set out to improve. 

## IS 413 – Enterprise Application Development 

   
The time has come to apply all the skills that we have learned in class.  While you have not done everything that is required in this project, you have the foundation to be able to dig in and figure it out using .NET and React.  The web app you build will be the face of this project, so use it to impress the judges.  Here are the requirements:   
   
Build all the required pages with all the required functionality (including, but not limited to):   
   
**Public (Non-Authenticated Users)** 

* **Home / Landing Page:**  A modern, professional landing page that introduces the organization, its mission, and provides clear calls to action for visitors to engage or support.   
* **Impact / Donor-Facing Dashboard:**  Displays aggregated, anonymized data showing the organization’s impact (e.g., outcomes, progress, and resource use) in a clear and visually understandable way.   
* **Login Page:**  Allows users to authenticate using a username and password, with proper validation and error handling.   
* **Privacy Policy \+ Cookie Consent:**  Provides a privacy policy explaining data usage and includes a GDPR-compliant cookie consent notification (see the IS414 section for more information). 

**Admin / Staff Portal (Authenticated Users Only)** 

* **Admin Dashboard:** Provides a high-level overview of key metrics such as active residents across safehouses, recent donations, upcoming case conferences, and summarized progress data. Think of this as the “command center” for staff managing daily operations.  
* **Donors & Contributions:** Allows staff to view, create, and manage supporter profiles, including classification by type (monetary donor, volunteer, skills contributor, etc.) and status (active/inactive). Tracks all types of contributions (monetary, in-kind, time, skills, social media) and allows staff to record and review donation activity. Supports viewing donation allocations across safehouses and program areas.  
* **Caseload Inventory:** This is the core case management page. It maintains records for all residents following the structure used by Philippine social welfare agencies. Staff can view, create, and update resident profiles including demographics, case category and sub-categories (e.g., trafficked, victim of physical abuse, neglected), disability information, family socio-demographic profile (4Ps beneficiary, solo parent, indigenous group, informal settler), admission details, referral information, assigned social workers, and reintegration tracking. This page should support filtering and searching by case status, safehouse, case category, and other key fields.  
* **Process Recording:** Provides forms for entering and viewing dated counseling session notes for each resident. Each process recording entry captures the session date, social worker, session type (individual or group), emotional state observed, a narrative summary of the session, interventions applied, and follow-up actions. Staff should be able to view the full history of process recordings for any resident, displayed chronologically. This is the primary tool for documenting the healing journey of each resident.  
* **Home Visitation & Case Conferences:** Allows staff to log home and field visits, including the visit type (initial assessment, routine follow-up, reintegration assessment, post-placement monitoring, or emergency), observations about the home environment, family cooperation level, safety concerns, and follow-up actions. Also provides a view of case conference history and upcoming conferences for each resident.  
* **Reports & Analytics:** Displays aggregated insights and trends to support decision-making. This should include donation trends over time, resident outcome metrics (education progress, health improvements), safehouse performance comparisons, and reintegration success rates. Consider structuring reports to align with the Annual Accomplishment Report format used by Philippine social welfare agencies, which tracks services provided (caring, healing, teaching), beneficiary counts, and program outcomes.


**Misc** 

* Any additional pages required to support functionality described in other portions of the project (e.g., security, social media, accessibility, or partner features). 

   
Use .NET 10 / C\# on the back end and React / TypeScript (Vite) on the front end. You can choose from Azure SQL Database, MySQL, or PostgreSQL for the relational database. The security database may be housed separately if you choose. Use good database principles in your design. Your app and your database must both be deployed. I would recommend using Microsoft Azure since you have the practice and the credits, but it is totally up to your team if you want to make it harder on yourself and deploy somewhere else. ;) You may modify the database as needed.   
    
Make sure to validate data and handle errors so the website is robust and reliable. Put into practice all the things we learned about writing good code. Pay attention to the details and finishing touches—titles, icons, logos, consistent look and feel, pagination, speed, and other elements that separate good websites from excellent ones.   

## IS 414 \- Security 

The IS414 portion of INTEX includes BOTH applying skills you have already learned AND learning how to implement a few new skills now that you have sufficient technical background to complete them.   
   
In industry, features that are not documented (especially security features) don’t “exist”. If you would like to receive INTEX points for the security requirements, they MUST be clearly shown in your group’s submitted video. Please don’t spend hours implementing features and then spend seconds or minutes documenting a fraction of your work unless you would prefer to receive a fraction of the points. Appeals to grant points that are not documented at the due date will be denied.   
 

### Requirements 

* Confidentiality (Encryption)   
* Use HTTPS for all public connections. It is fine if you use a subdomain and you may rely upon certificates automatically provided by the cloud provider, but you must have a valid certificate to enable TLS.   
* Redirect HTTP traffic to HTTPS.   
* Authentication   
* Provide the functionality to authenticate users using a username/password (likely using ASP.NET Identity). Your identity database can be in SQLite or found in a database server.   
* Visitors (unauthenticated users) should be able to browse the home page of the site (and possibly other pages that do not need authentication)   
* Authenticated users should be able to view the page(s) described in the IS413 section.   
* Configure ASP.NET Identity (or your chosen Identity provider) to require better passwords than the default PasswordOptions (see [https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-configuration?view=aspnetcore-10.0](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-configuration?view=aspnetcore-10.0) for information on the settings to change, but DO NOT follow the values suggested there). This will be STRICTLY graded according to how you were taught in class and how you were instructed to implement password policies in your lab. AI or other code/documentation suggesting policies that conflict with how you were taught in class will NOT be considered a reason to grant points.   
* All APIs should have the appropriate authentication/authorization. For example, a /login and /auth/me endpoint cannot require authentication/authorization or else they are useless, but endpoints supporting most CRUD operations (certainly all the “CUD” operations and likely some “R” operations) of the database must only be accessible/usable to authenticated and appropriately authorized users. When in doubt, make it maximally restrictive unless it breaks functionality.   
* Role-Based (RBAC) Authorization   
* Only an authenticated user with an admin role should be able to add, modify, or in rare cases delete data. Only authenticated users who are donors should be able to see their donor history and the impact of those donations. Non-authenticated users without a role should be able to see some of the site (e.g., homepage, privacy policy, etc.). You may choose whether or not to have a staff (or employee) role that differs from the admin user.   
* Integrity   
* Data should only be able to be changed or deleted by an authorized, authenticated user and there must be confirmation required to delete data. For example, an administrator could update or delete data because they are authorized to do so.   
* Credentials   
* Handle credentials (usernames and passwords, API keys, etc.) safely. You may choose to use a secrets manager, place secrets in a separate file (e.g., an .env file) that is not uploaded to a code repository like GitHub or set environmental variables in your operating system. All three of these are viable options and will be granted full points. Some of these options are easier in deployment than others. You should not include credentials in your code or public repositories. Please note that having a functional site is worth more overall points than protecting credentials properly, so prioritize wisely (as much as this pains your instructor). Make it obvious how you are implementing this in your video.   
* Privacy   
* Create and populate the content of a GDPR-compliant privacy policy that is linked from the footer of your site (at a minimum on the home page). You may use existing templates (see [https://gdpr.eu/privacy-notice/](https://gdpr.eu/privacy-notice/)) or generators, but the content should be tailored to your site. This will not be evaluated by a lawyer, and you should not pay for this. Current LLMs are quite adept at creating and modifying “boilerplate” privacy policies.   
* Enable a GDPR-compliant cookie consent notification. Be specific in your video about whether this is cosmetic or fully functional.   
* Attack Mitigations   
* Enable the Content-Security-Policy (CSP) HTTP **HEADER**. Specify the sources you need for your site to function and no more (e.g., you might choose to define default-src, style-src, img-src, script-src, etc., but only choose what you need). It is possible to embed CSP information in a \<meta\> tag in the HTML, but that is not what is being evaluated here. Graders will be evaluating whether the CSP header is present in the developer tools inspector.   
* Availability   
* Your site should be publicly accessible. This likely means that it is deployed to a cloud provider of your selection.   
* Additional Security Features   
* Some points will be allocated to adding additional security/privacy features beyond what is explicitly listed here. This allows for creativity in approach. Whatever you add, you must make clear to the TAs in your video documentation. Please briefly describe what you added and why it was added. The following list is not exhaustive but may give an idea of what types of features to consider. Some could be worth full points; most will be worth partial points depending on complexity and time required to implement and so you may choose to implement multiple additional security features.   
* Enable at least one type of third-party authentication. The third-party provider(s) are up to you.   
* Enable at least one form of two-factor or multi-factor authentication. You have flexibility in the choice and implementation. Note: You must have at least one admin and one non-admin user account without 2FA or MFA for grading purposes so we can access your site without having your phones/faces/etc.   
* Enable HTTP Secure Transport Security (HSTS) on your site. This can be tricky or trivial depending on your chosen cloud architecture. A single line of code is sufficient in some cases, but NOT in others. Don’t underestimate the time required here in case your deployment is “tricky”.   
* Enable a browser accessible cookie (i.e., NOT an httponly cookie) that saves a user setting that is used by React to change the page. Examples might include light/dark mode preferences, color theme preferences, language preferences, etc.    
* Enable data sanitization (for incoming data) or data encoding (for data rendered by the frontend) to help prevent injection attacks   
* Deploy both operational and identity databases to “real” DBMS (i.e., not SQLite).   
* Deploy using Docker containers instead of simply deploying to a VM   
* Or many, many other potential options 

### Security Rubric 

| Objective  | Points Possible  |
| :---- | :---: |
| Confidentiality \- Use HTTPS/TLS  | 1  |
| Confidentiality \- Redirect HTTP to HTTPS  | 0.5  |
| Auth \- Authentication using username/password  | 3  |
| Auth \- Require better passwords  | 1  |
| Auth \- Pages and API endpoints require auth where needed  | 1  |
| Auth \- RBAC- Only admin user can CUD (including endpoints)  | 1.5  |
| Integrity \- Confirmation to delete data  | 1  |
| Credentials \- Stored securely and not found in public repository  | 1  |
| Privacy \- Privacy policy created and added to site (customized as needed)  | 1  |
| Privacy \- GDPR cookie consent notification fully functional  | 1  |
| Attack Mitigations \- CSP header set properly  | 2  |
| Availability – Deployed publicly  | 4  |
| Additional security features  | 2  |

 

## 

## IS 455 – Machine Learning 

   
 The organization you are building technology for collects rich data across multiple dimensions: donor activity, resident case histories, counseling sessions, education progress, health outcomes, home visitation reports, safehouse operations, and social media engagement. The organization’s leadership wants to understand how machine learning can help them make better decisions and improve outcomes for the girls they serve.

This is your opportunity to practice **pipeline thinking**, the central idea of this course. Machine learning is not a collection of algorithms learned in isolation. It is an end-to-end decision system that begins with problem framing and ends with deployed, monitored systems. Your task is to demonstrate that you can build that complete system thoughtfully, creatively, and rigorously.

### Requirements

You should deliver **as many complete machine learning pipelines as you can identify and have time to build**, integrated into or supported by the web application your team is building. Each pipeline must follow the full end-to-end ML pipeline as taught in the textbook and should address a meaningful business question for the organization. There is no maximum. The more pipelines your team delivers (with quality), the better your score. However, don’t spend more time on this requirement than it’s worth (1/5 of your overall INTEX grade).

Each pipeline should demonstrate the full lifecycle as outlined in the Foreword:

1\.        **Problem Framing** (Ch. 1): Define the business question, select success metrics, and determine whether a predictive or explanatory approach is appropriate. This is one of the most important decisions you will make. As the textbook explains, *prediction* and *explanation* are two distinct modeling goals that are related but not interchangeable. Predictive modeling aims to generate reliable predictions judged by performance on new, unseen data. Explanatory modeling aims to understand and quantify relationships between variables, ideally identifying cause-and-effect patterns that can inform strategy or policy. Confusing these two goals is a common source of costly analytical mistakes. For each pipeline, generate both a causal and predictive model. Besides deploying a predictive pipeline, indicate within the .ipynb file which features are most impactful and recommend decisions that can be made based on the results

2\.        **Data Acquisition and Preparation** (Ch. 2–5, 7): Identify and collect the data needed from the provided tables. Clean, transform, and engineer features from raw data. As the textbook notes, data preparation is often the most time-intensive stage of any analytics project. Expect to spend 60–80% of your pipeline effort here. Build reproducible data preparation pipelines (Ch. 7), not one-off scripts.

3\.        **Exploration** (Ch. 6, 8): Examine distributions, relationships, and anomalies to build intuition about the data before modeling. This is where you discover what the data can actually tell you. Look for the relationships that have been built into this dataset. They are there to be found.

4\.        **Modeling** (Ch. 9–14): Select and train algorithms that learn patterns from the data. You may use any approach covered in the course: multiple linear regression for causal or predictive purposes (Ch. 9–11), decision trees (Ch. 12), classification (Ch. 13), or ensemble methods like bagging, boosting, and stacking (Ch. 14). Remember that for explanatory work, a model that sacrifices some predictive accuracy to produce clear, defensible estimates, like a carefully specified OLS regression, can be preferable to a black-box model with marginally better predictions. For predictive work, complex features and less interpretable models can be appropriate when they improve accuracy and operational performance.

5\.        **Evaluation and Selection** (Ch. 15): Assess model performance using appropriate metrics, validation strategies, and fairness checks. Use proper train/test splits or cross-validation. Tune hyperparameters. Compare multiple models where appropriate. Most importantly, interpret your results *in business terms*. Don’t just report an R² or accuracy score. Explain what the numbers mean for the organization’s decisions.

6\.        **Feature Selection** (Ch. 16): Thoughtfully select which features to include. Demonstrate that you understand why certain features matter and others don’t. Use feature importance, selection techniques, or domain reasoning to justify your choices.

7\.        **Deployment** (Ch. 17): Move your validated model into the production web application where it can generate predictions, automate decisions, or inform stakeholders. This could mean serving predictions through an API endpoint, displaying model outputs on a dashboard, or providing an interactive interface where users can input data and receive predictions or insights.

Each pipeline should address a **different business problem**. Teams should try to demonstrate a variety of modeling approaches across their pipelines; ideally including at least one predictive model and one explanatory model, but this is not strictly required. The dataset has been designed with multiple discoverable relationships across the donor domain, the case management domain, and the social media/outreach domain. Look carefully at the data and think about what questions the organization would want answered.

#### **Why These Instructions Are Intentionally Vague**

In the real world, nobody hands you a target variable and tells you which algorithm to use. A business leader says “we need to understand our donors better” or “we’re worried about girls falling through the cracks” and it is *your job* as the data scientist to translate that into a concrete, solvable problem. As the textbook describes in the Career Pathways section, effective practitioners at the problem framing stage “determine which questions are worth answering, select success metrics, and translate context into requirements technical teams can implement.” The ability to look at a dataset and see opportunities, to ask “what questions could this data answer?”, is one of the most valuable skills you will develop. This project is designed to simulate that experience.

You are not being told what to predict, what to classify, or what to explain. The data has been carefully constructed with real, discoverable relationships across multiple domains. Your task is to find them. You will be evaluated relative to each other, and the teams that identify more meaningful opportunities and execute them well will earn higher scores.

#### How to Use AI Effectively

You are encouraged to use AI tools throughout this process, but *how* you use AI matters. We recommend using AI in the following sequence, which mirrors the pipeline stages you have learned:

1\.        **AI as Problem Setter** (supports Problem Framing). Start by using AI to help you understand the business domain and brainstorm potential problems worth solving. Give AI the data dictionary and ask it to help you think about what questions the organization might need answered. Push it to consider both predictive questions (“Can we forecast which residents are ready for reintegration?”) and explanatory questions (“What factors most drive successful reintegration?”). Don’t accept its first suggestions uncritically. Push it to think deeper about the business context and to consider perspectives you might have missed.

2\.        **AI as Creative Expander** (supports Data Preparation and Exploration). Once you have a candidate problem, use AI to help you think about features you might engineer, relationships you might explore, and data from other tables you might join. Ask it to suggest transformations, interaction terms, or aggregations you might not have considered. Remember that 60–80% of pipeline effort is data preparation. This is where AI can help you think more broadly about the raw materials available to you.

3\.        **AI as Critical Evaluator** (supports Evaluation and the prediction/explanation tradeoff). Before you commit to a direction, use AI to poke holes in your approach. Ask it: “What could go wrong with this model? Am I confusing prediction with explanation?” Use it to stress-test your thinking the way a skeptical colleague would. For explanatory models, ask whether your causal claims are defensible. For predictive models, ask about data leakage and validation soundness.

4\.        **AI as Verification Agent** (supports Evaluation and Selection). Use AI to verify that your code is correct, your evaluation methodology is sound, and your results make sense. Ask it to review your train/test split, validate your metrics, and confirm that your feature selection and hyperparameter tuning are reasonable.

5\.        **AI as Production Agent** (supports Deployment). Finally, use AI to help you deploy your model, create API endpoints, build dashboard visualizations, and integrate your results into the web application. This is where AI can save you the most time on implementation details so you can focus on ensuring your deployed model provides real value to end users.

The key principle: *you* drive the thinking and decision-making at every stage. AI accelerates your work, but the intellectual ownership must be yours. You must understand and be able to explain every part of your pipeline. If you cannot explain why you made a particular choice, you are using AI incorrectly. The goal, as the textbook states, is “not just to fit models, but to build analytical capability that holds up in real environments.”

#### Applying the Principles from the Textbook

Your pipelines will be evaluated on how well they apply the principles taught in Chapters 1–17. Specifically, we will be looking for evidence that you understand:

•          **Pipeline thinking over algorithm-only thinking** (Foreword, Ch. 1): Each pipeline should tell a complete story from business problem to deployed solution, not just demonstrate that you can run an algorithm.

•          **The prediction vs. explanation distinction** (Foreword, Ch. 9–11): For each pipeline, you must explicitly state whether your goal is prediction or explanation and make modeling choices that are consistent with that goal. If you are explaining, coefficients and interpretability matter more than predictive accuracy. If you are predicting, out-of-sample performance matters more than whether individual coefficients are interpretable. Do not treat accurate predictions as causal evidence, and do not produce interpretable analyses that cannot be operationalized.

•          **Rigorous data preparation** (Ch. 2–3, 7): Feature engineering, handling missing data, building reproducible pipelines. The quality of what goes into the model matters as much as the model itself.

•          **Thoughtful exploration** (Ch. 6, 8): Demonstrate that you actually looked at the data before modeling. Distributions, correlations, anomalies, and relationships should be documented and should inform your modeling choices.

•          **Appropriate model selection** (Ch. 12–14): Use the right tool for the job. Consider multiple approaches. If you use an ensemble (Ch. 14), explain why it is appropriate. If you use a decision tree (Ch. 12), explain what you gain in interpretability.

•          **Evaluation discipline** (Ch. 15): Proper validation, appropriate metrics, honest interpretation of results. Understand the real-world consequences of errors for this specific organization.

•          **Feature selection with purpose** (Ch. 16): Don’t throw everything in and hope for the best. Demonstrate that you thought about which features matter and why.

•          **Deployment as a first-class concern** (Ch. 17): A model that only exists in a notebook is not a pipeline. Move it into production.

A team that demonstrates mastery of these principles across multiple pipelines will outscore a team that produces many pipelines with shallow execution. Quality and quantity both matter, but quality comes first.

### Rubric (20 points total)

Your score will be based on the number of complete, quality pipelines your team delivers. Each pipeline will be evaluated using the following criteria aligned with the full ML pipeline:

| Pipeline Stage | What We’re Evaluating |
| :---- | :---- |
| Problem Framing | Is the business problem clearly stated? Does it matter to the organization? Is the choice of predictive vs. explanatory approach explicitly justified? |
| Data Acquisition, Preparation & Exploration | Is the data explored thoroughly? Are missing values, outliers, and feature engineering handled well? Is the data preparation reproducible as a pipeline? Are joins across tables done correctly and documented? |
| Modeling & Feature Selection | Is the model appropriate for the stated goal (prediction or explanation)? Are multiple approaches considered or compared? Is feature selection thoughtful and justified? |
| Evaluation & Selection | Are appropriate metrics used? Is the model validated properly (e.g., train/test split, cross-validation)? Are results interpreted in business terms, not just statistical terms? |
| Deployment & Integration | Is the model deployed and accessible? Is it integrated with the web application in a meaningful way? Does it provide value to end users? |

### What to Submit

For each pipeline, submit a Jupyter notebook (.ipynb) in your team’s GitHub repository inside a folder named ml-pipelines/. Name each notebook descriptively (e.g., donor-churn-classifier.ipynb, reintegration-readiness.ipynb). Each notebook should be self-contained and tell the complete story of that pipeline from problem framing through deployment. Specifically, each notebook must include the following sections:

1\.        **Problem Framing.** A clear written explanation (not just code) of the business problem you are solving, who in the organization cares about it, and why it matters. Explicitly state whether your approach is predictive or explanatory and justify that choice using the framework from the textbook.

2\.        **Data Acquisition, Preparation & Exploration.** Load the relevant data, explore it visually and statistically, document what you find (distributions, correlations, missing values, outliers), and prepare it for modeling. Show your feature engineering decisions and explain why you made them. If you join data from multiple tables, explain the logic. Build this as a reproducible pipeline (Ch. 7), not a one-off script.

3\.        **Modeling & Feature Selection.** Build your model(s), compare approaches where appropriate, and document your choices. Justify your feature selection. If you try multiple algorithms, show the comparison. Include hyperparameter tuning if relevant. If your goal is explanatory, discuss what the model structure reveals about relationships in the data. If your goal is predictive, focus on out-of-sample performance.

4\.        **Evaluation & Interpretation.** Evaluate your model using appropriate metrics. Use proper validation (train/test split, cross-validation). Interpret your results *in business terms*, not just reporting an R² or accuracy score; explain what it means for the organization’s decisions. Discuss the real-world consequences of false positives and false negatives for this specific context.

5\.        **Causal and Relationship Analysis.** This is critical. For each pipeline, include a written analysis discussing the relationships you discovered in the data. What features are most important and why? Do the relationships make theoretical sense? If your model is explanatory, what causal story do the coefficients or feature importances tell? Are those causal claims defensible, or are you observing correlation? If your model is predictive, what does it reveal about the underlying data structure even if the goal isn’t causal inference? Be honest about the limitations: correlation is not causation, and you should discuss when you can and cannot make causal claims. This section is where you demonstrate that you understand the prediction vs. explanation distinction at a deep level.

6\.        **Deployment Notes.** Briefly describe how this model is deployed and integrated into the web application (e.g., API endpoint, dashboard component, interactive form). Include any relevant code snippets or references to where the integration code lives in the repo.

The notebook should be fully executable. A TA should be able to run it top to bottom and reproduce your results. Make sure your data paths are correct relative to the repository structure.

In addition to the notebooks, your deployed web application should include the model outputs in a meaningful way (predictions, dashboards, interactive tools, etc.) as described in the Deployment & Integration section of the rubric.

#### Important Notes

•          Each pipeline must address a genuinely different business problem, not just the same problem with different algorithms.

•          A poorly executed pipeline will not help your score. Focus on doing each pipeline well before starting the next one.

•          Notebooks that are not executable or that lack written analysis will receive significant deductions regardless of model quality.

# Final Deliverable Submission 

**Deliverable Due Date:** **Friday April 10 at 10:00 am** (the morning of the presentations).   
**Deliverable Submission Location:** [https://byu.az1.qualtrics.com/jfe/form/SV\_bsjPxSQyEdIQRhA](https://byu.az1.qualtrics.com/jfe/form/SV_bsjPxSQyEdIQRhA)    
**Deliverable Content:** 

1. **Group Information \-** Please provide the correct group number and group members.   
2. **URLs \-** Include the correct URLs to your Website, GitHub repository (linked to the correct branch), ipynb files for each pipeline (or a screenshot of your Azure ML Designer view), and video walkthroughs. Grading will go VERY badly if you make typos here.   
1. Please ensure when submitting that your GitHub repository is set to Public for grading purposes.    
2. **Video Summaries \-** Each team should submit a link to the videos (one for each class) that go through the requirements of IS413, IS414, and IS455. Please be succinct in your coverage of each feature. Graders get grumpy and stop granting points when submitted videos ramble. Submit a link to the video hosted PUBLICLY (e.g., Box, Dropbox, YouTube, etc.). Your video must be accessible to TAs and Instructors.   
1. This video should provide ALL information that the graders need to evaluate your solution. The video should demonstrate that you have completed the requirements outlined in this document. If you have not completed something, be forthright about it in the video. Do not try to pass off unfinished requirements as complete. This is considered academic misconduct. You do not need to have all team members present or even show yourself in the video. Be thorough, but concise.   
2. Videos do not need to be professional, but they should clearly demonstrate the completion of requirements (at high enough resolution) and succinctly. If you record the wrong screen in your video and the graders cannot see the features, no points will be granted. Please check your videos before submitting.    
3. The videos must be available to all who have the link (i.e., public or unlisted, but not private)   
4. Each video should address the requirements for that class only. For example, the IS455 TAs will not be viewing the videos for IS413 and vice versa.   
5. If you do not demonstrate the completion of a requirement in your video, it will be considered missing. “We finished it but forgot to put it in the video …” or “...but we showed that feature in the video for another class…” will not be considered acceptable reasons to grant points for items not demonstrated in the videos.   
3. **User Credentials** \- While you need to be very careful with credentials, please provide faculty and TAs the login credentials to your Web application. You will need to provide the usernames/passwords for the following:   
1. An admin user that does NOT have multi-factor authentication (MFA) enabled.    
2. A donor user that does NOT have multi-factor authentication (MFA) enabled but is connected with historical donations.   
3. An account (admin or donor) that DOES have multi-factor authentication (MFA) enabled. We won’t be able to get into this account, but we will use it to test whether MFA is required or not. 

   
The fastest way to upset your graders is making them do extra work to find the correct URLs or log in to your site. Points will be lost if we have to reach out for more information. Maximize your score by keeping your graders happy.   
 

# Peer Evaluation 

   
You MUST complete the INTEX2 Peer Eval by **Friday April 10th at 11:59 PM**. The survey can be found here:    
   
[https://byu.az1.qualtrics.com/jfe/form/SV\_7VXtQGm7rT4cvoa](https://byu.az1.qualtrics.com/jfe/form/SV_7VXtQGm7rT4cvoa)    
   
Please complete this immediately after your presentation. You will not receive an INTEX grade if you do not complete your peer evaluation. The results of your eval will be kept confidential, but it will affect team member grades. We want this to be fair for those that did the work. The solution is to make sure that you pull your weight and more. Help the team and be a great team member helping where needed and doing quality work\! 

# Presentation 

You will present your solution to a panel composed of industry professionals, faculty, and possibly TAs. Your solution will be evaluated on the quality of communication of the presentation, the effectiveness of your technology demo, your creativity in approaching the business problem, and how satisfied the clients are with your overall solution. The presentation will be worth 20% of the overall INTEX score.   
   
You will be randomly assigned a presentation slot. Presentations will be held Friday beginning at 12:00pm. A schedule with the assigned times for each group will be posted. Each presentation period will be structured as follows:   
   
Presentation and Tech Demo		20 minutes (Student group presents)   
Questions & Answers			5 minutes (Student group answers questions)   
Judge Deliberation 			5 minutes (Student group waits in the hall)   
Feedback 				5-10 minutes (Student group comes back to room)   
Break and Next Team Setup		5 minutes   
   
The judges for your presentation will take the role of the client. Your role is to pitch your system/solution as worthy of continued investment and/or adoption by the client. Get them excited about the system and how it meets their needs. The judging panel will be evaluating how your system works, how and whether it meets the client’s needs, the quality of the presentation, and whether you creatively went beyond the minimum requirements. The judges have technical expertise but will primarily evaluate the business case for investing in your solution.   
   
This is a business presentation with a substantive tech demo. The tech demo is likely the most important part of the presentation. Prioritize showing us your solution. The demo shouldn't be the only part of your presentation, but it is the most important part. It is probably useful to highlight the business problems and how you have solved them, but please don’t spend the majority of the presentation telling the client the case background.   
   
Do NOT bring handouts to the presentation. 

# Logistics

## Presentation Schedule 

Please double check your room/time on presentation day. It is your responsibility to arrange a swap with another team if you are unhappy with your presentation time. Include BOTH teams in a Slack DM to Professor Wells to initiate a conversation about a swap. 

## Slack 

A Slack workspace has been set up for you to communicate with instructors, TAs, the clients, and other students (see below). Please use this link:    
   
[https://join.slack.com/t/intexw26/shared\_invite/zt-3udumsa9x-P87AgyhpD\_DDG64adcimmg](https://join.slack.com/t/intexw26/shared_invite/zt-3udumsa9x-P87AgyhpD_DDG64adcimmg)    
   
You will be able to create your own channels for your team within this workspace. 

## Questions  

You are not able to ask Faculty and TAs for help with technical problems, but you are welcome to ask questions in regard to the case itself or the requirements. However, due to the number of groups and students involved, please post any questions on the ***\#questions*** channel in our INTEX Slack workspace so that everybody can benefit from the response and that the faculty are not answering the same question over and over again to different groups.   
   
You may ask questions to other students working on the project (use the “questions” channel in our slack workspace), but you may not ask questions of former students who have completed a similar project in a past INTEX. Seeking help from previous students in any way or using any of their material would be considered cheating. You may ask questions of people in industry or other outside help, but the work must be your own. 

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

 

