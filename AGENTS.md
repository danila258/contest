# Working on the student programming platform

Read [requirements.md](requirements.md) before changing product behavior. It contains the requested stack and the supplied Russian specification. Its final section, “Последующие доработки”, records questions and enhancements awaiting agreement. [PLAN.md](PLAN.md) gives a suggested implementation order. Earlier brainstorming about Python submissions, contest points, and leaderboards does not define the product.

## Domain vocabulary

- A subject (предмет) contains practical assignments (практические работы). Each assignment contains an ordered mix of quizzes (тесты) and C++ programming tasks (задачи по программированию). Distinguish a quiz from the automated checks for a program.
- Keep the deadline to **start** an attempt distinct from its server-controlled solving timer. A student who starts just before the deadline has the full configured solving time.
- Keep the autosaved draft, the student's own run, and the immutable submission distinct. A student's own run has no effect on credit. Grade each activity using the latest completed attempt.
- In a sequential assignment, automated success unlocks the next activity. Teacher confirmation applies to the assignment as a whole. An extra attempt applies to one student's specific activity.

## Making changes

Trace changes through the affected student or teacher workflow, FastAPI checks, and persisted PostgreSQL state. Use Gravity UI for both roles and Vite for local frontend development. Keep Docker startup aligned with the services actually present.

If a task depends on an unresolved rule, identify the matching item in “Последующие доработки” and ask for a decision on that behavior. Continue independent work. When a rule is agreed, update the requirements and its acceptance scenario together.

Run checks for the affected workflow and report the commands and results. This workspace starts with documentation only. Add concrete startup and test commands when the corresponding implementation exists.
