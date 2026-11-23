# Contest

Contest is a teaching platform for programming assignments. Teachers assemble assignments from a shared bank of C++ tasks and quizzes. Students open an assignment, answer questions and submit solutions.

The current prototype runs in the browser. It uses React, Vite, Gravity UI and Monaco. Subjects, assignments and attempts created through the interface are saved in the current browser profile. Server-side storage and C++ execution are planned for later milestones.

## Run locally

Use Node.js 22 and npm. If you use nvm, run `nvm install` from the repository root to select the version in [.nvmrc](.nvmrc). Then start the development server from the same directory.

```sh
npm ci
npm run dev
```

Open the URL printed next to `Local`, usually [localhost:5173](http://localhost:5173). Enter `mirea` in both the username and password fields for demo access. After signing in, you can switch between the student and teacher roles.

## Verify a change

```sh
npm test
npm run build
```

The tests use the Node.js test runner. Vite writes the production build to `dist/`. Run `npm run preview` and open the URL printed in the terminal to try that build.

## Documentation

| I want to… | Start here |
| --- | --- |
| Pick up a task, brief an AI assistant or prepare a change for review | [Contributing](CONTRIBUTING.md) |
| Check a product rule, acceptance scenario or open question | [Product requirements (Russian specification)](docs/requirements.md) |
| Find a UI component, verify a screen or import JSON | [Frontend development guide](docs/development.md) |
| Understand the planned milestones | [Implementation plan](docs/plan.md) |
| Set up an AI assistant for this repository | [Agent instructions](AGENTS.md) |
