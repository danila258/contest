# Contributing

## Before starting a task

Run the project using the [README](README.md). Describe the user role, the screen, the steps to take and the expected outcome. For a bug, include what actually happened and how to reproduce it. For example, if a bank selector looks wrong, record whether you opened the assignment form from a subject or from the assignment list, and at what viewport width you saw the issue.

Link the relevant section of the [requirements](docs/requirements.md). If the change depends on an open question under “Последующие доработки” (follow-up items), cite its number. Once the team agrees on a rule, update the requirement and its acceptance scenario together. For a visual change, find a comparable screen in the [frontend guide](docs/development.md).

Start a separate branch from the team's current `main`. For example, with `main` checked out and up to date, run `git switch -c fix/bank-filter`. Give each contributor or AI session a separate working directory when tasks run in parallel. To start a second task from this repository, run `git worktree add -b fix/quiz-timer ../contest-quiz-timer main`, then run `npm ci` in the new directory.

## Find the relevant code

| Workflow | Entry point | Related code |
| --- | --- | --- |
| Navigation, roles and browser storage | [main.jsx](src/main.jsx) | [Sign-in](src/LoginPage.jsx), [navigation](src/WorkspaceNavigation.jsx) |
| Create an assignment and select activities | [AssignmentForm.jsx](src/AssignmentForm.jsx) | [Activity fields](src/AssignmentActivities.jsx), [shared bank](src/TaskBank.jsx), [activity data](src/activityData.js) |
| Manage subjects, semesters and copies | [SubjectSettings.jsx](src/SubjectSettings.jsx) | [Semester rules](src/semester.js), [copy logic](src/subjectCopy.js) |
| Complete an assignment | [StudentActivity.jsx](src/StudentActivity.jsx) | [Student attempts](src/studentAttempt.js), [statistics](src/WorkStatistics.jsx) |
| Import data | [JSON validation](src/importData.js) | [Templates](public/), [CLI](scripts/import-json.js), [tests](tests/import-data.test.js) |

## Working with AI

Point the assistant to the repository root and [AGENTS.md](AGENTS.md) if your tool does not load it automatically. Give it a user scenario and an observable acceptance condition. For example:

> In the teacher's assignment form, place the bank task and quiz selectors side by side. Use the existing responsive layout. Open the form from both the subject page and the assignment list. At 390 px, both controls should fit the screen. Verify that each can attach a material. Report the checks you ran and the files you changed.

Link decisions recorded in the repository so another contributor can resume the task without access to the chat. Use fictional data to reproduce issues. Keep infrastructure passwords, SSH keys and real student submissions out of prompts, commits and screenshots.

## Prepare a change for review

Inspect `git diff` and `git status`. For application changes, run `npm test` and `npm run build`. To check one workflow during development, run its test file directly, for example `node --test tests/subject-copy.test.js`. Exercise UI changes in the affected role. For layout changes, check viewport widths of 390 and 1280 px. For storage changes, open records from the previous version, save an edit and reload in the same browser profile.

Include the following in a merge request or a message to the reviewer:

- **Outcome.** Describe the affected workflow and how the reviewer can tell the change works.
- **Verification.** List the commands and browser steps you ran, their results and anything still unverified. Include a screenshot for a visual change.
- **Data and decisions.** Explain compatibility if a stored record or import format changed. Link the updated rule or guide.

The author reviews the entire diff, including AI-generated code and documentation. The reviewer should be able to repeat the scenario in their own checkout. Agree on the exact commit separately when requesting a VPS deployment.
