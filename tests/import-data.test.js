import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {readBank, readSubjects, readWorks} from "../src/importData.js";
import {currentSemester} from "../src/semester.js";
import {demoTeacher} from "../src/subjectOptions.js";
import {subjects, works as demos} from "../src/data.js";
import {collectTasks} from "../src/activityData.js";

function template(name) {
  return JSON.parse(readFileSync(new URL(`../public/${name}-template.json`, import.meta.url), "utf8"));
}

function library() {
  return {tasks:collectTasks([]), questions:[], works:[]};
}

function readWork(work, bank = library()) {
  return readWorks({works:[work]}, subjects, null, bank, demos);
}

test("downloadable templates start with an English format description for agents", () => {
  for (const name of ["subjects", "tasks", "works"]) {
    const data = template(name);
    assert.equal(Object.keys(data)[0], "_comment");
    assert.match(data._comment, /For AI agents:/);
  }
});

test("subjects retain cover, access and Markdown fields, and always include the owner", () => {
  const data = template("subjects");
  const row = data.subjects[0];
  // Downloaded examples specify an illustrative year; the creation window moves annually.
  row.academicYear = currentSemester().academicYear;
  row.teachers = ["Андрей Соколов"];
  assert.deepEqual(readSubjects(data, subjects), [{
    ...row, teacher:demoTeacher, teachers:[demoTeacher, ...row.teachers],
  }]);
  assert.throws(() => readSubjects(data, [row]), /subjects\.0\.id/);
  row.semesterNumber = 13;
  assert.throws(() => readSubjects(data, []), /subjects\.0\.semesterNumber/);
});

test("bank template preserves both check modes, sources, reference and theory links", () => {
  const data = template("tasks");
  const {tasks, questions} = readBank(data, subjects, null, library());
  for (const [index, task] of tasks.entries()) {
    const row = data.tasks[index];
    assert.deepEqual(task.sources, row.sources);
    assert.equal(task.mode, row.mode);
    for (const [i, check] of row.cases.entries()) {
      for (const [key,value] of Object.entries(check)) assert.equal(task.cases[i][key], value);
      assert.ok(task.cases[i].id);
    }
  }
  const [task] = tasks;
  assert.equal(task.reference, data.tasks[0].reference);
  assert.equal(task.minutes, String(data.tasks[0].minutes));
  assert.equal(task.logs, data.tasks[0].logs);
  assert.deepEqual(task.checks, data.tasks[0].checks);
  assert.deepEqual(questions[0], {...data.questions[0], kind:"theory"});
});

test("legacy bank files accept the selected subject; explicit foreign links are rejected", () => {
  const row = {title:"Задача", prompt:"Условие", cases:[{input:"", output:"1"}]};
  const bank = library();
  const data = {tasks:[row]};
  const [task] = readBank(data, subjects, "cpp", bank).tasks;
  assert.equal(task.subject, "cpp");
  assert.ok(task.id);
  assert.throws(() => readBank(data, subjects, "", bank), /tasks\.0\.subject/);
  const question = {title:"Вопрос", prompt:"Условие", subject:"alg", taskIds:["arrays"]};
  assert.throws(() => readBank({questions:[question]}, subjects, "cpp", bank), /questions\.0\.taskIds/);
  assert.equal(readBank({questions:[{...question, taskIds:[]}]}, subjects, "cpp", bank).questions[0].subject, "alg");
  assert.throws(() => readBank({tasks:[{...row,mode:"unit"}]}, subjects, "cpp", bank), /tasks\.0\.cases/);
});

test("work template imports ordered quiz, bank snapshot and inline task with local deadlines", () => {
  const [row] = template("works").works;
  const {works:[work], tasks:[inlineTask]} = readWork(row);
  assert.equal(work.opensAt, new Date(row.opensAt).toISOString());
  assert.equal(work.dueAt, new Date(row.dueAt).toISOString());
  assert.equal(work.sequential, row.sequential);
  assert.equal(work.review, row.review);
  const [quiz, linked, inline] = work.activities;
  const [source] = row.activities;
  for (const key of ["title","back","shuffle","timer"]) assert.equal(quiz[key], source[key]);
  for (const key of ["attempts","minutes","threshold"]) assert.equal(quiz[key], String(source[key]));
  assert.equal(quiz.questions[0].minutes, String(source.questions[0].minutes));
  assert.equal(quiz.questions[0].prompt, source.questions[0].prompt);
  assert.deepEqual(quiz.questions[0].answers.map(({text,correct}) => ({text,correct})), source.questions[0].answers);
  assert.equal(linked.taskId, row.activities[1].taskId);
  assert.notEqual(linked.id, linked.taskId);
  assert.equal(inline.taskId, inlineTask.id);
  assert.equal(inline.subject, row.subject);
});

for (const [name, change] of [
  ["opening before academic year", w => {w.opensAt = "2026-08-31T23:59";}],
  ["deadline after academic year", w => {w.dueAt = "2027-09-01T00:00";}],
  ["deadline equals opening", w => {w.dueAt = w.opensAt;}],
  ["impossible calendar date", w => {w.dueAt = "2027-02-30T12:00";}],
  ["question timer with backtracking", w => {w.activities[0].back = true;}],
  ["unreachable threshold", w => {w.activities[0].threshold = 2;}],
  ["no correct answer", w => {w.activities[0].questions[0].answers.forEach(a => {a.correct = false;});}],
  ["duplicate attachment", w => {w.activities.push(w.activities[1]);}],
  ["wrong subject for attached task", w => {w.subject = "alg";}],
  ["unknown field", w => {w.deadline = w.dueAt;}],
]) {
  test(`work import rejects ${name}`, () => {
    const [work] = template("works").works;
    change(work);
    assert.throws(() => readWork(work), /works\.0/);
  });
}

const recordsWithoutId = [
  {
    path:"subjects.0.id",
    importRow:fields => readSubjects({subjects:[{
      title:"Курс", academicYear:currentSemester().academicYear, semesterNumber:1, ...fields,
    }]}, subjects)[0],
  },
  {
    path:"tasks.0.id",
    importRow:fields => readBank({tasks:[{title:"Задача", prompt:"Условие", ...fields}]}, subjects, "cpp", library()).tasks[0],
  },
  {
    path:"questions.0.id",
    importRow:fields => readBank({questions:[{title:"Вопрос", prompt:"Почему?", ...fields}]}, subjects, "cpp", library()).questions[0],
  },
  {
    path:"works.0.id",
    importRow:fields => readWork({title:"Работа", subject:"cpp", opensAt:"2026-09-01T00:01", dueAt:"2027-08-31T23:59", ...fields}).works[0],
  },
];

for (const {path, importRow} of recordsWithoutId) {
  test(`${path}: an omitted id generates a UUID; empty and whitespace-only ids are rejected`, () => {
    assert.match(importRow({}).id, /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
    for (const id of ["", "   "]) {
      assert.throws(() => importRow({id}), error => error.message.startsWith(path + " — "));
    }
  });
}
