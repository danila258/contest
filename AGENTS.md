# Working on the student programming platform

Read [requirements.md](docs/requirements.md) before changing product behavior. It contains the requested stack and the supplied Russian specification. Its final section, “Последующие доработки”, records questions and enhancements awaiting agreement. [PLAN.md](docs/PLAN.md) gives a suggested implementation order. Earlier brainstorming about Python submissions, contest points, and leaderboards does not define the product.

For UI changes, read the [frontend development guide](docs/development.md). It records the component choices, interaction patterns and verification workflow agreed for this project. The current deliverable is a React and Vite frontend with browser-local demo data. FastAPI, PostgreSQL, Docker and the judging service belong to later milestones.

## Domain vocabulary

- A subject (предмет) contains practical assignments (практические работы). Each assignment contains an ordered mix of quizzes (тесты) and C++ programming tasks (задачи по программированию). Distinguish a quiz from the automated checks for a program.
- The assignment submission deadline applies to every attempt, including one already in progress. Use the earlier of the submission deadline and any configured solving timer.
- Keep the autosaved draft, the student's own run, and the immutable submission distinct. A student's own run has no effect on credit. Grade each activity using the latest completed attempt.
- In a sequential assignment, automated success unlocks the next activity. Teacher confirmation applies to the assignment as a whole. An extra attempt applies to one student's specific activity.

## Making changes

Follow the affected workflow from its entry point through rendering and persistence. Reuse existing project components and check the official Gravity UI ecosystem before implementing a control. Verify the API against the installed package version. Preserve previously saved subjects and attempts when changing data formats.

If a task depends on an unresolved rule, identify the matching item in “Последующие доработки” and ask for a decision on that behavior. Continue independent work. When a rule is agreed, update the requirements and its acceptance scenario together.

Run checks for the affected workflow and report the commands and results. The frontend uses local demonstration data. With Node.js 22 and npm installed, run `npm ci` once, `npm run dev` for the Vite development server, and `npm run build` to verify the production bundle.
