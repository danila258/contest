import {starter, works as demos} from "./data.js";

import {newId as id} from "./newId.js";
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
    tasks.set(demo.id, {...newActivity("program"), id:demo.id, title:demo.title, prompt:demo.task});
  }
  for (const work of works) {
    for (const item of work.activities ?? []) {
      if (item.kind !== "program") continue;
      const id = item.taskId ?? item.id;
      if (!tasks.has(id)) tasks.set(id, {...item, id});
    }
  }
  return [...tasks.values()];
}

// Older snapshots can identify a quiz by its original work and activity IDs.
export function worksUsingActivity(works, item, ownerId, bankQuizzes) {
  const isQuiz = item.kind === "quiz";
  const promotedQuiz = isQuiz && ownerId && bankQuizzes.find(quiz => quiz.sourceWorkId === ownerId && quiz.sourceActivityId === item.id);
  const quizId = item.quizId ?? promotedQuiz?.id ?? (ownerId ? undefined : item.id);
  const quiz = isQuiz && bankQuizzes.find(row => row.id === quizId && row.kind === "quiz");
  const taskId = item.taskId ?? item.id;
  return works.filter(work => {
    if (ownerId && work.id === ownerId) return true;
    if (!work.activities) {
      return isQuiz ? Boolean(work.question && quiz?.sourceWorkId === work.id && quiz.sourceActivityId === work.id)
        : Boolean(work.task && work.id === taskId);
    }
    return work.activities.some(activity => {
      if (activity.kind !== item.kind) return false;
      if (!isQuiz) return (activity.taskId ?? activity.id) === taskId;
      return Boolean(quizId && activity.quizId === quizId) ||
        (quiz?.sourceWorkId === work.id && quiz.sourceActivityId === activity.id);
    });
  });
}

// Recover embedded materials when opening older browser libraries. Work and attempt IDs stay stable.
export function registerWorkMaterials(library) {
  const withoutSubject = ({subject, ...record}) => record;
  const tasks = new Map(library.tasks.map(row => [row.id,withoutSubject(row)]));
  const questions = new Map(library.questions.map(row => [row.id,withoutSubject(row)]));
  const works = library.works.map(work => {
    if (!work.activities) return work;
    const activities = work.activities.map(raw => {
      if (!raw.kind) return raw;
      const item = withoutSubject(raw);
      if (item.kind === "program") {
        const taskId = item.taskId ?? item.id;
        if (!tasks.has(taskId)) {
          const {taskId:link, ...record} = item;
          tasks.set(taskId,{...record,id:taskId});
        }
        return {...item,taskId};
      }
      const promoted = !item.quizId && [...questions.values()].find(q =>
        q.sourceWorkId === work.id && q.sourceActivityId === item.id);
      let quizId = item.quizId ?? promoted?.id ?? item.id;
      if (!item.quizId && !promoted) {
        while (questions.has(quizId)) quizId = work.id + "/" + quizId;
      }
      if (!questions.has(quizId)) {
        const {quizId:link, ...record} = item;
        questions.set(quizId,{...record,id:quizId,taskIds:[],sourceWorkId:work.id,sourceActivityId:item.id});
      }
      return {...item,quizId};
    });
    return {...work,activities};
  });
  return {...library,tasks:[...tasks.values()],questions:[...questions.values()],works};
}

function demoQuiz(work) {
  return {...newActivity("quiz"),id:work.id,title:work.title,taskIds:[],sourceWorkId:work.id,sourceActivityId:work.id,
    questions:[{id:work.id,minutes:"5",prompt:work.question,answers:work.answers.map((text,i) =>
      ({id:String(i),text,correct:text === work.correct}))}]};
}

export function withDemoQuizzes(library) {
  const questions = [...library.questions];
  for (const demo of demos.filter(w => w.question)) {
    if (!questions.some(q => q.sourceWorkId === demo.id && q.sourceActivityId === demo.id)) {
      const quiz = demoQuiz(demo);
      while (questions.some(row => row.id === quiz.id)) quiz.id = "demo/" + quiz.id;
      questions.push(quiz);
    }
  }
  return registerWorkMaterials({...library,questions});
}
