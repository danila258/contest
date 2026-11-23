# Frontend development guide

The React and Vite prototype lets users switch roles in the UI. Demo assignments ship with the application. Subjects, assignments, drafts and submissions created in the browser persist in `localStorage`. Submitting C++ saves a snapshot of the solution. Code execution and judging are planned for later milestones. See the [product requirements](requirements.md) and [implementation plan](plan.md).

## Change a workflow

1. Walk through the workflow in the affected role. For visual issues, inspect the screen in a browser and identify the component, prop or style responsible.
2. Find an existing implementation in the component guide below. For a new control, check the Gravity UI ecosystem and verify the API against the installed version. Check new dependencies for compatibility with the project's React and UIKit versions. [Project dependencies](../package.json) · [Gravity UI repositories](https://github.com/orgs/gravity-ui/repositories)
3. Follow the change through the full workflow. For a subject field, check its default, editing, cancellation, saving, reopening and student view. Support older records with missing fields or earlier formats.
4. Exercise the change in the browser and build the application. For layout changes, include 390 px and 1280 px viewports. Report what you verified. Record agreed product rules in the requirements and reusable UI patterns in this guide.

Use Node.js 22 and npm. Run `npm ci` to install dependencies and `npm run dev` to start Vite. Run `npm run build` to verify the production bundle and `npm run preview` to open it locally.

Run `npm test` to check JSON imports, bank links, copying, semesters and student attempts. The CLI import test uses a temporary copy of the data store.

## Import JSON

Teachers can download a JSON template and import a file from the subjects, assignments and activity bank screens. Browser imports add records to the current browser profile. Each template starts with an English format description in `_comment`. File names are arbitrary. [Subjects](../public/subjects-template.json) · [Bank](../public/tasks-template.json) · [Assignments](../public/works-template.json)

In the assignment form, “Добавить задания из JSON” appends the `activities` array to the draft in file order. An editable task or quiz also accepts a single activity of the matching type. Importing it replaces that activity in place. Saving the assignment persists the changes. [Activity set](../public/activities-template.json) · [Quiz](../public/quiz-template.json) · [Programming task](../public/program-template.json)

To import data from the repository root, run:

```sh
npm run import:json -- subjects.json tasks.json works.json
```

The CLI processes files in argument order, validates the whole batch and writes it to the [application seed data](../src/imported-data.json). Vite picks up changes during development. Rebuild to include them in a production bundle. These records are available across browser profiles according to the usual access rules. Browser edits take precedence for the same ID.

Supply a unique `id` for records that other files reference. An assignment's `subject` field contains the subject ID (for example, `cpp`), which distinguishes subjects with the same title across academic years. In the UI, a selected subject filter supplies the default for an assignment with no `subject`. In the CLI, supply it for each assignment. Bank materials are shared across subjects. Imports ignore the legacy `subject` field on bank materials. Import subjects first, then bank tasks, then assignments referencing them. An omitted ID generates a UUID. A repeated explicit ID fails validation. The examples use 2026/2027. Adjust the academic year and local dates for the target subject.

## Components and interaction patterns

| Workflow | Implementation | Code |
| --- | --- | --- |
| Navigation | Use `AsideHeader` and `MobileHeader` from Gravity UI Navigation. Use the UIKit `User` and `Avatar` for the profile. | [WorkspaceNavigation](../src/WorkspaceNavigation.jsx) |
| Subject forms and assignment workspace | Use the full-screen `WorkspacePage`. Keep cancel and create/save actions accessible while scrolling. The header returns to the originating subject, overview or assignment list and preserves its filters and search. The student workspace spans the screen. Place the timer and quiz question numbers on the left and the prompt and answers in the center. Show the activity list on the right after a quiz attempt finishes and while solving programming tasks. On phones, show an activity selector above the prompt in those same states. Place question navigation below the card. After a quiz attempt ends, show activity navigation according to the access order. | [WorkspacePage](../src/WorkspacePage.jsx) |
| Create and edit assignments | The subject page and the assignment list open the same full-screen form with cancel and create actions. Editing an open assignment loads its current values and offers save. The form holds a Web Lock keyed by assignment ID. Student start confirmation uses the same lock across tabs in one browser profile and origin. Keep quizzes and programming tasks in one ordered list. Lay out the bank selectors with `assignmentPair` in two columns, switching to one at 600 px and below. Use Markdown for prompts and Monaco for starter code. | [AssignmentForm](../src/AssignmentForm.jsx) |
| Assignment list | Use the shared catalogue table with a subject filter and title search. When a teacher creates an assignment, preselect the subject from the active filter. | [Main screens](../src/main.jsx) |
| Shared activity bank | Search materials and filter by the subjects of linked assignments. Use `CatalogueTable` for both catalogues. Display an icon and plain-text title on the first line. Only assignment rows show a subject caption. Hover and keyboard focus highlight the whole row. Clicking the row or pressing Enter on the title opens the same teacher preview used inside an assignment. Show as many linked assignment titles as fit in the column. “ещё N” expands the full list in place. From the preview, allow editing and return to the filtered bank. Show save after the first edit to an existing material and create for new materials. Individual theory prompts expand within their rows. | [TaskBank](../src/TaskBank.jsx) |
| Bank persistence | The original assignment stores the task ID and a snapshot at attachment time. When copying a subject, its new assignments reference bank tasks and resolve their content on opening. Save the copied subject and its assignments together in `practice.library`. Saving an assignment adds its newly authored tasks and quizzes to the bank. A theory question can link to tasks by ID. | [TaskBank](../src/TaskBank.jsx) |
| Theme | Use Gravity UI's `ThemeProvider`. Follow the system theme by default. The appearance button in the header offers system, light and dark modes. System mode tracks device changes. Persist the choice in the browser and pass the active theme to Monaco through `useThemeType`. | [Appearance](../src/Appearance.jsx) |
| Overview and lists | Use `Card` for subjects, UIKit `Table` for assignments and `Label` for status. Show deadlines in the “Сдать до” column. The subject page header returns to the subject list. | [Main screens](../src/main.jsx) |
| Required fields | Use `FormRow required` from `@gravity-ui/components` to show the required marker. Connect `fieldId` to the input's `id` and pass `controlProps={{ required: true }}` to `TextInput` for browser validation. | [Subject settings](../src/SubjectSettings.jsx) |
| Groups, students and teachers | Use `Select` with `multiple` and `filterable`. Support partial name matches and preserve selections when the query changes. The subject author retains access. | [Access settings](../src/SubjectSettings.jsx) |
| Subject cover | Stack two equal-width picker buttons. Each opens a `Popup` with a `Palette` of ten colors or ten icons. Give options accessible names. Reuse `SubjectCover` in the preview and card. | [SubjectCover](../src/SubjectCover.jsx) |
| Groups on teacher cards | Measure the available row width. On overflow, reserve space for the “ещё N” counter itself. | [SubjectGroups](../src/SubjectGroups.jsx) |
| Markdown and math | `MarkdownField` wraps the Gravity UI Markdown editor. Preview and reading views share `MarkdownContent`, markdown-it and KaTeX. Preserve the source Markdown for editing. | [Editor](../src/MarkdownField.jsx) · [Renderer](../src/MarkdownContent.jsx) |
| C++ editing | Load Monaco with C++ support. Restore the draft after a reload and preserve the original contents of a submitted snapshot. | [CodeEditor](../src/CodeEditor.jsx) |
| Semester and academic year | Use `Select` for semester number (1–12) and academic year. Calculate the current period with `@gravity-ui/date-utils`. Reuse the same date and legacy-record helpers in forms, cards and the overview. | [Semester rules](../src/semester.js) |

## Task and quiz previews

Use an open assignment in the teacher interface as the reference for a standalone material page. Reuse `WorkspacePage` and `subjectInfo` in the bank. Put the material title and “К банку” in the header. Below it, show linked assignments in a fieldset with its label on the top border. Place the edit action in the bottom action bar.

Use `TeacherActivityPreview` both in the bank and inside assignments. For a programming task, enclose the prompt label and its text in one fieldset and the code checks in another. In the expandable “Тесты” section, give each test case its own fieldset with its number and either its input and expected output or its unit-test code. Use `legend` for fieldset labels. In a quiz, keep each question and its answers in one card. Show the activity title in the header on a standalone page and immediately before the content inside an assignment.

For visual changes, open the same programming task and quiz from the bank and from an assignment scheduled to open in the future. Compare content width, padding, borders, settings backgrounds and question layout on wide and narrow screens in light and dark themes.

## Styling and verification

- Use Gravity UI interaction states. Use `Button view="action"` for the primary action and `Button.Icon` for a leading icon. Use text-only create and add buttons. The application theme supplies the primary accent. Teachers choose each subject's cover color.
- Wrap each Markdown field in a rounded `fieldset` with a `legend` on the top border. Space adjacent editors apart and keep the label visible after entry. For an empty field, use a relevant example or question, such as “Что нужно проверить, прежде чем зачесть работу?” for acceptance criteria.
- For access changes, check both roles. The teacher view shows access groups and acceptance criteria. The student overview applies access rules and the current semester to subjects, assignments and deadlines.
- For date changes, test February 4–5 and August 31–September 1. The overview shows odd semesters in autumn and even semesters in spring. Legacy autumn and spring records map to semesters 1 and 2 respectively. February 5 changes the season within the academic year. September 1 starts a new academic year. Offer the current academic year and the next three in the selector. Preserve an older subject's stored year when reopening it.
