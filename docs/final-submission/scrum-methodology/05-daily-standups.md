\# Daily Stand-Up and Scrum Meeting Summaries



This document summarises the team’s Scrum meetings and daily stand-up style meetings for the Campus Food Ordering Platform.



The purpose of these summaries is to show how the team communicated during each sprint, tracked progress, identified blockers, made decisions, and agreed on next steps.



Some meetings were formal sprint planning or sprint review meetings, while others were daily scrum / progress meetings. They are included here as Scrum evidence because they show continuous team coordination throughout the project.



\---



\# Sprint 1 Meeting Summaries



\## Sprint 1 Meeting 1 — Sprint Planning Meeting



| Field | Details |

|---|---|

| Date | 30 March 2026 |

| Type | In-person planning meeting |

| Duration | 1 hour 30 minutes |

| Attendees | Raquel, Keitu, Lesego, Lukho, Ntando, Sthembile, Calvin |



\### Main Purpose



The purpose of this meeting was to begin Sprint 1, identify the main focus areas, discuss the first user stories, and split the starting tasks between team members.



\### Main Points Discussed



\- The team identified the main Sprint 1 focus areas:

&#x20; - User verification

&#x20; - Menu management

\- The team identified the required user stories for:

&#x20; - Student authentication

&#x20; - Vendor authentication

&#x20; - Admin authentication

&#x20; - Menu creation

&#x20; - Menu display and availability

&#x20; - Admin controls

\- The team discussed how the system should handle different user roles:

&#x20; - Student

&#x20; - Vendor

&#x20; - Admin

\- The team discussed the initial system tools and structure:

&#x20; - HTML

&#x20; - CSS

&#x20; - JavaScript

&#x20; - Supabase Authentication

&#x20; - Firestore / database storage

\- The team agreed to use GitHub Issues and GitHub Projects for user stories and task tracking.

\- The team agreed that members should work on separate branches and commit regularly.



\### Blockers / Issues



\- The project was still new, so members were still learning how the system would be structured.

\- The task split was not yet fully refined.

\- Some members were still unsure how their parts would connect to the full system.



\### Outcome



\- Sprint 1 focus areas were agreed.

\- Initial user stories were identified.

\- Tasks were allocated to team members.

\- The team agreed to use GitHub for tracking and collaboration.

\- Development began after the meeting.



\---



\## Sprint 1 Meeting 2 — Scrum / Planning Meeting



| Field | Details |

|---|---|

| Date | 7 April 2026 |

| Type | WhatsApp Scrum / Planning Meeting |

| Duration | 16 minutes |

| Attendees | All team members present |



\### Main Purpose



The purpose of this meeting was to check progress, clarify GitHub workflow, and make sure user stories and acceptance tests were being handled properly.



\### Main Points Discussed



\- The team discussed the CI/CD pipeline that had already been set up on GitHub.

\- The team explained how automated checks work when code is pushed.

\- The team confirmed that user stories must be created as GitHub Issues.

\- User stories needed to follow the Who–What–Why format.

\- Acceptance tests needed to follow the Given–When–Then format.

\- The team discussed the vendor approval system.

\- Vendor accounts should remain pending until approved by an admin.

\- The team agreed on the branching strategy:

&#x20; - Each member works on their own branch.

&#x20; - No one pushes directly to main.

&#x20; - Changes should be merged through pull requests.

\- The team clarified role responsibilities for student and admin functionality.

\- All roles needed to reuse the shared authentication setup.



\### Blockers / Issues



\- Some members still needed clarity on role responsibilities.

\- The team needed to make sure everyone understood the Git workflow.

\- Some user stories still needed clearer acceptance tests.



\### Outcome



\- The team agreed to continue using the CI pipeline.

\- GitHub Issues were confirmed as the place for user stories.

\- Branching and pull request workflow were reinforced.

\- The team agreed to maintain a shared authentication system.



\---



\## Sprint 1 Meeting 3 — Scrum Progress Meeting



| Field | Details |

|---|---|

| Date | 10 April 2026 |

| Type | WhatsApp Scrum / Progress Meeting |

| Duration | 30 minutes |

| Attendees | All team members present |



\### Main Purpose



The purpose of this meeting was to review completed functionality, clarify admin access, and check progress before the end of Sprint 1.



\### Main Points Discussed



\- The team discussed whether admin functionality should be public or private.

\- The team agreed that admin access should remain private for better system control.

\- The team reviewed completed functionality.

\- The following features were confirmed as implemented:

&#x20; - Login

&#x20; - Registration

&#x20; - Forgot Password

\- The team discussed how menu creation would be integrated into the vendor dashboard.

\- Vendors would manage menu items directly from the vendor dashboard.

\- The team aligned on remaining Sprint 1 development work.



\### Blockers / Issues



\- Some parts of the system still needed clearer integration.

\- Menu creation needed to be connected properly to the vendor dashboard.

\- Sprint review preparation still needed to be organised.



\### Outcome



\- Admin functionality would remain private.

\- Login, registration, and password-related functionality were confirmed as working.

\- Menu creation would be implemented inside the vendor dashboard.

\- The team agreed to continue building the remaining Sprint 1 features.



\---



\## Sprint 1 Meeting 4 — Sprint Review Preparation Meeting



| Field | Details |

|---|---|

| Date | 13 April 2026 |

| Type | WhatsApp Call |

| Duration | 19 minutes |

| Attendees | All team members present |



\### Main Purpose



The purpose of this meeting was to check whether Sprint 1 features were ready and to prepare for the Sprint 1 presentation/review.



\### Main Points Discussed



\- The team confirmed that all Sprint 1 features were complete and working.

\- The system was reviewed to make sure the main functionality worked.

\- The team discussed who would present each part of the system.

\- Presentation roles were assigned to team members.

\- The team identified the requirement to implement a third-party identity provider.

\- Google authentication was discussed as an important requirement.

\- The team noted that one member had already started adjusting the code for Google authentication.

\- The team agreed to focus on the current working system for the Sprint 1 presentation.



\### Blockers / Issues



\- Third-party identity provider support still needed to be fully implemented.

\- Presentation preparation happened late.

\- Some members needed more time to prepare clear explanations of their work.



\### Outcome



\- The system was considered ready to present.

\- Presentation responsibilities were assigned.

\- Google authentication was acknowledged as an important next step.

\- The team planned to improve third-party authentication in the next sprint.



\---



\# Sprint 2 Meeting Summaries



\## Sprint 2 Meeting 1 — Sprint Planning Meeting



| Field | Details |

|---|---|

| Date | 15 April 2026 |

| Type | WhatsApp Sprint Planning Meeting |

| Duration | Approximately 27 minutes |

| Attendees | All team members present |



\### Main Purpose



The purpose of this meeting was to begin Sprint 2, select the Sprint 2 backlog, improve task structure from Sprint 1, and agree on a clearer workflow.



\### Main Points Discussed



\- The team agreed that Sprint 2 would focus on the ordering workflow.

\- The selected Sprint 2 focus areas were:

&#x20; - Cart and order placement

&#x20; - Database and backend logic

&#x20; - Vendor dashboard and order management

&#x20; - Order status updates

&#x20; - Student tracking interface

&#x20; - Real-time updates and notifications

\- The team agreed that user stories must follow the Who–What–Why format.

\- Acceptance tests must follow the Given–When–Then format.

\- Tasks must be small, manageable, and linked directly to user stories.

\- The team discussed lessons from Sprint 1:

&#x20; - Uneven workload distribution

&#x20; - Lack of clear ownership

&#x20; - Inconsistent contribution levels

\- The team agreed to improve:

&#x20; - Task breakdown

&#x20; - Equal participation

&#x20; - Communication

&#x20; - Accountability

\- The GitHub Projects board workflow was agreed:

&#x20; - Backlog

&#x20; - Ready

&#x20; - In Progress

&#x20; - Done

\- Git workflow was reinforced:

&#x20; - Each member works on their own branch.

&#x20; - No direct commits to main.

&#x20; - Work must be submitted through pull requests.

\- Sthembile was assigned as the main code reviewer.



\### Blockers / Issues



\- The team needed to correct the poor task organisation from Sprint 1.

\- Some members needed clearer responsibilities.

\- The team needed to improve contribution tracking.



\### Outcome



\- Sprint 2 structure was clearly defined.

\- Tasks were distributed more evenly.

\- The team agreed on clearer user stories, acceptance tests, and task ownership.

\- The GitHub workflow and review process were formalised.



\---



\## Sprint 2 Meeting 2 — Daily Scrum / Progress Meeting



| Field | Details |

|---|---|

| Date | 17 April 2026 |

| Type | WhatsApp Daily Scrum |

| Duration | Approximately 16 minutes |

| Attendees | All team members present |



\### Main Purpose



The purpose of this meeting was to provide progress updates, check alignment, and make sure Sprint 2 work was moving forward.



\### Main Points Discussed



\- Each member briefly reported:

&#x20; - What they had completed

&#x20; - What they were currently working on

&#x20; - What they planned to complete next

\- The team confirmed steady progress across assigned tasks.

\- Work remained aligned with Sprint 2 user stories and task allocations.

\- Members were reminded to push completed work to their own branches.

\- Members were reminded to submit work through pull requests.

\- The code reviewer would review pull requests before merging into main.



\### Blockers / Issues



\- No major blockers were reported.

\- No serious technical issues were raised during this meeting.



\### Outcome



\- The team confirmed that Sprint 2 work was on track.

\- Members continued working on their assigned tasks.

\- The team agreed to keep using the project board and Git workflow.



\---



\## Sprint 2 Meeting 3 — Daily Scrum / Final Progress Meeting



| Field | Details |

|---|---|

| Date | 19 April 2026 |

| Type | WhatsApp Daily Scrum / Progress Meeting |

| Duration | Approximately 29 minutes |

| Attendees | All team members present |



\### Main Purpose



The purpose of this meeting was to review overall Sprint 2 progress, confirm completion of major tasks, and identify any remaining work.



\### Main Points Discussed



\- The team confirmed that all major Sprint 2 features had been completed.

\- The full system flow was reviewed end-to-end.

\- The team checked how the different parts of the system connected.

\- The implemented functionality matched the Sprint 2 user stories and acceptance tests.

\- Minor remaining issues were identified:

&#x20; - Complete the notifications feature.

&#x20; - Fix timestamp display so students can see:

&#x20;   - Time the order was placed.

&#x20;   - Time the order status changed.



\### Blockers / Issues



\- No major blockers were reported.

\- Only minor functionality fixes remained.

\- Notifications and timestamp display needed final attention.



\### Outcome



\- Sprint 2 was functionally almost complete.

\- The team moved into final refinement and testing.

\- Remaining work was clearly identified.



\---



\# Sprint 3 Meeting Summaries



\## Sprint 3 Meeting 1 — Sprint Planning Meeting



| Field | Details |

|---|---|

| Date | 24 April 2026 |

| Type | Sprint Planning Meeting |

| Duration | 30 minutes |

| Attendees | All team members present |



\### Main Purpose



The purpose of this meeting was to begin Sprint 3, decide which features would be completed, divide work between members, and agree on the dependency order.



\### Main Points Discussed



\- The team agreed that Sprint 3 would focus on two major features:

&#x20; - Online payments

&#x20; - Dietary system

\- The online payment feature would allow students to pay for food orders during checkout.

\- The dietary system would allow menu items to be labelled with dietary tags and filtered by students.

\- The payment work was divided into:

&#x20; - Payment API

&#x20; - Order and payment logic

&#x20; - Payment UI

\- The dietary work was divided into:

&#x20; - Dietary tag definitions and vendor UI

&#x20; - Dietary backend/database

&#x20; - Student filtering frontend

\- The team agreed on the work order:

&#x20; - Start first: Person 2 and Person 4

&#x20; - Start second: Person 3 and Person 5

&#x20; - Start last: Person 1 and Person 6



\### Blockers / Issues



\- Dependent tasks could not start properly until foundational tasks were completed.

\- Payment and dietary tag formats needed coordination between team members.



\### Outcome



\- Sprint 3 goal was agreed.

\- Work was divided between all six members.

\- Payment and dietary dependency flows were clearly defined.

\- The team understood who needed to start first.



\---



\## Sprint 3 Meeting 2 — General Scrum / Progress Meeting



| Field | Details |

|---|---|

| Date | 30 April 2026 |

| Type | General Scrum / Project Progress Meeting |

| Duration | 16 minutes |

| Attendees | All team members present |



\### Main Purpose



The purpose of this meeting was to discuss Sprint 3 progress, especially the payment feature and dietary requirements feature.



\### Main Points Discussed



\- The team discussed which payment provider to use.

\- PayFast was chosen for the online payment system.

\- Students would place an order and then complete payment through PayFast.

\- The team agreed that students should only be able to order from one vendor at a time.

\- This would make payment and order tracking simpler.

\- Vendors should only receive and process orders after successful payment.

\- The student dashboard should separate:

&#x20; - Active Orders

&#x20; - Order History

\- Once an order is collected, it should move from Active Orders to Order History.

\- The team discussed dietary requirements.

\- The dietary system should include common options:

&#x20; - Halal

&#x20; - Vegan

&#x20; - Vegetarian

&#x20; - Gluten-free

&#x20; - Nut-free

\- The team also agreed that a custom dietary input should be supported.



\### Blockers / Issues



\- Payment and order flow needed to be kept simple.

\- Multi-vendor payments could create confusion, so the team decided to restrict orders to one vendor at a time.

\- Dietary requirements needed a clear and consistent list.



\### Outcome



\- PayFast was selected.

\- One-vendor checkout was agreed.

\- Vendors would only receive paid orders.

\- Active Orders and Order History were added to the student-side plan.

\- Dietary requirements would include common options and a custom input option.



\---



\## Sprint 3 Meeting 3 — General Scrum / Progress Meeting



| Field | Details |

|---|---|

| Date | 8 May 2026 |

| Type | General Scrum / Project Progress Meeting |

| Duration | 15 minutes |

| Attendees | All team members present |



\### Main Purpose



The purpose of this meeting was to check Sprint 3 progress across payment, student-side work, vendor-side work, and dietary features.



\### Main Points Discussed



\- The payment feature was confirmed as complete.

\- The student side was still in progress.

\- The vendor side was complete but still needed review before being merged into main.

\- Sthembile needed to review the vendor side before upload/merge.

\- Dietary requirements progress:

&#x20; - Person 4 had completed their part.

&#x20; - Person 5 was still in progress.

&#x20; - Person 6 was still in progress.

\- The team checked for blockers.



\### Blockers / Issues



\- No blockers were identified.

\- Vendor-side work still needed review before merging.

\- Student-side and some dietary work were still in progress.



\### Outcome



\- Payment was confirmed as done.

\- Vendor work was done but awaiting review.

\- Dietary work was partly complete.

\- The team had no major blockers at this stage.



\---



\## Sprint 3 Meeting 4 — Final Scrum / Merge Preparation Meeting



| Field | Details |

|---|---|

| Date | 10 May 2026 |

| Type | General Scrum / Project Progress Meeting |

| Duration | 12 minutes |

| Attendees | All team members present |



\### Main Purpose



The purpose of this meeting was to confirm final Sprint 3 progress and discuss next steps before merging everything into the main branch.



\### Main Points Discussed



\- The team confirmed that all Sprint 3 parts were complete:

&#x20; - Payment feature

&#x20; - Student side

&#x20; - Vendor side

&#x20; - Dietary requirements feature

\- It was agreed that Sthembile would merge everything into the main branch.

\- After merging, the team would check whether the full project worked smoothly.

\- Any bugs found after merging would need to be fixed before submission or review.

\- The team was reminded to complete and update UML diagrams.

\- UML diagrams needed to reflect:

&#x20; - Payment flow

&#x20; - Student order flow

&#x20; - Vendor order flow

&#x20; - Dietary requirements feature



\### Blockers / Issues



\- No blockers were identified.

\- The main risk was whether everything would work smoothly after merging.



\### Outcome



\- All Sprint 3 work was confirmed complete.

\- Main branch merge was planned.

\- UML diagram updates were assigned as a final requirement.

\- The team moved into final integration and checking.



\---



\## Sprint 3 Meeting 5 — Sprint Review Meeting



| Field | Details |

|---|---|

| Date | 11 May 2026 |

| Type | Team Sprint Review |

| Duration | 17 minutes |

| Attendees | All team members present |



\### Main Purpose



The purpose of this meeting was to review Sprint 3 work, check whether the sprint goal was achieved, discuss what went well, identify issues, and agree on improvements for Sprint 4.



\### Main Points Discussed



\- The team reviewed the Sprint 3 goal.

\- The main goal was to complete and integrate:

&#x20; - Payment system

&#x20; - Dietary system

\- The team agreed that the sprint goal was achieved.

\- Completed work included:

&#x20; - Online payment system

&#x20; - PayFast payment flow

&#x20; - Dietary tagging system

&#x20; - Dietary filtering system

&#x20; - Updated UML diagrams

&#x20; - Integration into the main project

&#x20; - Final testing and system flow review

\- The payment system was considered one of the strongest parts of the sprint.

\- The team discussed GitHub branch management issues.

\- One team member worked on an outdated branch, which made merging more difficult.

\- The team agreed that new work should always be based on the latest updated code.

\- Communication needed improvement.

\- Members needed to update the group more often and ask for help earlier.



\### Blockers / Issues



\- No major unresolved blockers remained.

\- The main issue was GitHub-related.

\- Merge conflicts and outdated branches created integration difficulty.

\- Communication during the sprint could have been better.



\### Outcome



\- Sprint 3 was considered successful.

\- The payment and dietary features were completed and integrated.

\- The team agreed to improve communication and branch management in Sprint 4.



\---



\# Sprint 4 Meeting Summaries



\## Sprint 4 Meeting 1 — Sprint Planning and Task Breakdown Meeting



| Field | Details |

|---|---|

| Date | 12 May 2026 |

| Type | Sprint 4 Planning / First Scrum Meeting |

| Duration | 25 minutes |

| Attendees | Team members present |

| Sprint Status | In progress |



\### Main Purpose



The purpose of this meeting was to start Sprint 4, define the analytics sprint goal, divide tasks between the six members, and agree on the order of work.



\### Sprint 4 Goal



The Sprint 4 goal is to build an admin analytics section for the Campus Food Ordering Platform.



The analytics section should include:



\- Sales per vendor over time

\- Peak ordering hours

\- Custom analytics view

\- Export reports as CSV or PDF



\### Main Points Discussed



\- The team agreed that Sprint 4 would focus on analytics.

\- The team identified the main analytics features.

\- The team divided the work between all six members:

&#x20; - Person 1: Analytics backend/data foundation

&#x20; - Person 2: Analytics dashboard page/layout

&#x20; - Person 3: Sales per vendor over time report

&#x20; - Person 4: Peak ordering hours report

&#x20; - Person 5: Custom analytics view

&#x20; - Person 6: Export reports as CSV/PDF

\- The team agreed on the work order:

&#x20; - Person 1 starts first.

&#x20; - Person 2 starts dashboard layout using mock/sample data.

&#x20; - Persons 3, 4, and 5 build their reports after Person 1 confirms the data format.

&#x20; - Person 6 builds export functionality once report data structures are clear.

&#x20; - Everyone tests their own feature before merging.

\- The team discussed dependencies to avoid confusion during implementation.



\### Blockers / Risks Discussed



\- Other reports depend on clean analytics data from Person 1.

\- Person 2’s dashboard layout is needed so other reports have a place in the UI.

\- Person 6 cannot complete exports until report data structures are available.

\- If the data format is unclear, Persons 3, 4, 5, and 6 may be blocked.



\### Outcome



\- Sprint 4 analytics goal was agreed.

\- Individual roles were clearly assigned.

\- The dependency order was confirmed.

\- Person 1 would begin with the analytics backend/data foundation.

\- Person 2 would begin the dashboard layout using mock data.

\- The remaining members would prepare their report sections and wait for the confirmed data format.



\### Next Steps



\- Person 1 starts the analytics backend/data foundation.

\- Person 1 shares the final analytics data format with the team.

\- Person 2 prepares the analytics dashboard layout.

\- Persons 3, 4, and 5 prepare report sections.

\- Person 6 prepares export functionality after report data structures are known.



\---



\## Sprint 4 Meeting 2 — Daily Scrum / Branch Coordination and Analytics Integration Meeting



| Field | Details |

|---|---|

| Date | 15 May 2026 |

| Type | Daily Scrum Meeting |

| Duration | 13 minutes |

| Sprint | Sprint 4 — Analytics |

| Main Focus | Person 1’s completed analytics backend work and team coordination on the shared branch |

| Sprint Status | In progress |



\### Main Purpose



The purpose of this meeting was to check Sprint 4 progress, confirm Person 1’s completed analytics backend work, and agree on how the rest of the team should connect to the shared analytics branch.



\### Main Points Discussed



\- Person 1 confirmed that their Sprint 4 analytics backend work was complete.

\- Person 1 prepared the analytics data source.

\- Person 1 created the `GET /api/analytics` endpoint.

\- The endpoint provides clean paid-order data for the rest of the analytics reports.

\- The analytics endpoint returns useful fields such as:

&#x20; - Vendor name

&#x20; - Order date

&#x20; - Order time

&#x20; - Order hour

&#x20; - Order total

&#x20; - Payment status

&#x20; - Items

\- The team discussed how the remaining members should connect to Person 1’s completed backend data.

\- Persons 2, 3, 4, 5, and 6 can now connect their features to the real analytics data instead of only using mock data.

\- The team discussed the risk of everyone working on the same branch.

\- The main concern was that multiple people editing the same files could cause merge conflicts.

\- The team agreed that everyone must pull the latest version before editing or pushing code.

\- The team decided to continue working on the same branch as Person 2 because Person 2 controls the analytics dashboard layout.

\- Persons 3, 4, 5, and 6 should mainly work in their own JavaScript files to reduce conflicts.



\### Important Team Rule Agreed On



Before making changes or pushing code, each person must first pull the latest version of the branch.



During analytics branch integration, the team agreed to regularly use:



```text

git checkout feature/analytics-dashboard-UI

git pull origin feature/analytics-dashboard-UI

---



\## Sprint 4 Meeting 3 — Daily Scrum / Final Sprint Preparation Meeting



| Field | Details |

|---|---|

| Date | 17 May 2026 |

| Type | Daily Scrum Meeting |

| Duration | 10 minutes |

| Sprint | Sprint 4 |

| Main Focus | Final Sprint 4 progress, export work, UML diagrams, video preparation, and final report |

| Sprint Status | Almost complete / preparing for Sprint 4 review |



\### Main Purpose



The purpose of this meeting was to discuss the current progress of Sprint 4 and prepare for the final Sprint 4 review and final project submission.



\### Main Points Discussed



\- The team confirmed that almost all Sprint 4 parts had been completed.

\- The project is nearly ready for the final Sprint 4 review.

\- The remaining work is mainly focused on:

&#x20; - Final documentation

&#x20; - Exporting PDF documents

&#x20; - Collecting and updating UML diagrams

&#x20; - Preparing the final presentation video

&#x20; - Finalising the final report

\- Sthembile is still working on exporting the PDF documents.

\- The PDF export work still needs to be completed so that the final report and submission files can be prepared properly.

\- The team was reminded to send and update their UML diagrams.

\- The UML diagrams are needed for the final documentation and sprint evidence.

\- The team discussed the final sprint video.

\- Sthembile will be responsible for creating the final sprint video.

\- Raquel will be responsible for implementing and finalising the final report.

\- The team is almost ready for the final sprint review, with only a few final items left to complete.





\### Blockers / Risks Discussed



| Blocker or Risk | Solution |

|---|---|

| PDF exports not finished yet | Sthembile will complete the exports |

| UML diagrams still missing from some members | All members were reminded to send or update diagrams |

| Final report still needs completion | Raquel will finalise the report |

| Final video still needs to be created | Sthembile will create the video |

| Sprint 4 review is close | Team will focus on final polishing and evidence preparation |



\### Outcome



The meeting confirmed that Sprint 4 is almost complete. The remaining focus is on final polishing, completing PDF exports, collecting UML diagrams, preparing the final video, and finalising the report.



The team is nearly ready for the Sprint 4 review and final project submission.

