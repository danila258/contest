import {starter, works as demos} from "./data.js";

const id = () => crypto.randomUUID();
export const answer = () => ({id: id(), text: "", correct: false});
export const question = () => ({id: id(), prompt: "", minutes: "5", answers: [answer(), answer()]});
export const testCase = () => ({id: id(), input: "", output: "", code: ""});
export const defaultChecks = {format:"block", static:"warn", dynamic:"warn"};
export const programModes = {stdout:"Сравнение STDOUT", unit:"Unit-тесты", none:"Без тестов"};

export function savedActivity(item) {
  return item.kind === "program" && item.mode === "none" ? {...item, cases:[], logs:false} : item;
}

export const files = ["main.cpp", "task_name.cpp", "task_name.h"];
export function newActivity(kind) {
  const common = {id: id(), kind, title: ""};
  if (kind === "quiz") return {...common, attempts: "1", threshold: "1", back: false, shuffle: true,
    timer: "whole", minutes: "30", questions: [question()]};
  return {...common, prompt: "", mode: "stdout", sources: {"main.cpp": starter}, cases: [testCase()],
    reference: "", minutes: "", logs: false, checks: {...defaultChecks}};
}

export function collectTasks(works) {
  const tasks = new Map();
  for (const demo of demos.filter(work => work.task)) {
    tasks.set(demo.id, {...newActivity("program"), id:demo.id, title:demo.title, prompt:demo.task, subject:demo.subject});
  }
  for (const work of works) {
    for (const item of work.activities ?? []) {
      if (item.kind !== "program") continue;
      const id = item.taskId ?? item.id;
      if (!tasks.has(id)) tasks.set(id, {...item, id, subject:work.subject});
    }
  }
  return [...tasks.values()];
}
