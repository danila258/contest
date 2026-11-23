# Implementation plan

These milestones group the approved [requirements](requirements.md) into deliverable workflows. The acceptance examples are checkpoints for each milestone.

The [current prototype](../README.md) runs both roles in Vite and persists demo data in the browser. The milestones below describe the target platform. When implementing server-backed access in milestone 1, verify the shared login against FastAPI.

| Milestone | Deliverable | Acceptance example |
| --- | --- | --- |
| 1. Access and subjects | Docker startup, FastAPI, PostgreSQL and a shared Gravity UI login. Add subject settings, group access, teacher access and the practical assignment list. | A teacher configures a subject. An assigned student signs in at the same login page and sees the subject, its student guidance and its assignment list. |
| 2. Assignment and quiz attempts | Mixed activity ordering, access dates, quiz authoring, Markdown with math, attempt limits, answer shuffling, navigation and timer settings. Add autosave, resume and automatic submission. | A student starts one minute before the submission deadline, reloads, and resumes with saved answers. The attempt expires at the earlier of its timer and the submission deadline. On expiry the server grades the last saved answers. Per-question timers are available only with forward-only navigation. |
| 3. Programming workflow | Starter files, editor, student input, independent runs, immutable submissions, STDOUT and unit-test modes, reference solutions, configurable checks and failure logs. | In unit-test mode a student edits the three specified files and runs their own main.cpp. Submitting for checking records a snapshot. Subsequent edits leave that snapshot intact. Blocking checks affect credit and advisory findings remain visible. |
| 4. Progress and review | Optional sequential unlocking, latest-attempt grading, assignment status, teacher review, comments, extra attempts, activity-event reporting and deadline displays. | Automated success unlocks the next activity before teacher review. After all activities pass, a work requiring confirmation shows «ожидает проверки». The teacher reviews answers, code and durations, grants an extra attempt for one activity, and the student sees the teacher's status and comment. |

## Decisions needed during implementation

Before connecting a runner to student submissions, settle the C++ environment, isolation and resource limits, visibility of closed-test output, and submission accounting with the project owner (follow-up items 4–8). Use the remaining numbered follow-ups when planning access administration, retakes, changes to published activities and deployment. Record accepted decisions in the specification so future agents can implement and verify the same behavior.
