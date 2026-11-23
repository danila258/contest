import {newId} from "./newId.js";
import {academicYearOf, currentSemester} from "./semester.js";
import {newActivity} from "./activityData.js";

export const bankIdOf = subject => subject?.bankId ?? subject?.id;

// Keep local clock time. February 29 becomes February 28 in a non-leap year.
function shiftYear(value, years) {
  const date = new Date(value);
  const day = date.getDate();
  date.setDate(1);
  date.setFullYear(date.getFullYear() + years);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day,lastDay));
  return date;
}

export function referenceWorkTasks(work) {
  return {...work,activities:work.activities.map(item =>
    item.quizId ? {id:item.id,quizId:item.quizId} : item.kind === "program" ? {id:item.id,taskId:item.taskId} : item)};
}

export function resolveWorkTasks(work, tasks, start, quizzes = []) {
  if (start?.activities) return {...work,activities:start.activities};
  if (!work?.activities?.some(item => (item.taskId || item.quizId) && !item.kind)) return work;
  return {...work, activities:work.activities.map(item => {
    if (item.kind) return item;
    if (item.quizId) {
      const quiz = quizzes.find(row => row.id === item.quizId && row.kind === "quiz");
      if (!quiz) throw Error("В банке отсутствует тест " + item.quizId);
      return {...quiz,...item};
    }
    if (!item.taskId) return item;
    const task = tasks.find(row => row.id === item.taskId);
    if (!task) throw Error("В банке отсутствует задача " + item.taskId);
    return {...task, ...item};
  })};
}

export function copySubjectLibrary(current, source, target, demos) {
  const bankId = bankIdOf(source);
  const years = Number(target.academicYear.slice(0,4)) -
    Number((academicYearOf(source) ?? currentSemester().academicYear).slice(0,4));
  const copies = [...current.works,...demos].filter(work => work.subject === source.id).map(work => {
    let items = work.activities;
    if (!items && work.question) {
      const quiz = newActivity("quiz");
      items = [{...quiz,title:work.title,questions:[{...quiz.questions[0],prompt:work.question,
        answers:work.answers.map(text => ({id:newId(),text,correct:text === work.correct}))}]}];
    }
    const activities = (items ?? [{taskId:work.id}]).map(item => {
      const id = newId();
      if (item.quizId) return {id,quizId:item.quizId};
      if (item.kind === "quiz") return {...structuredClone(item),id};
      const taskId = item.taskId ?? item.id;
      if (!current.tasks.some(task => task.id === taskId)) {
        throw Error(`Задача «${item.title ?? work.title}» отсутствует в банке.`);
      }
      return {id,taskId};
    });
    const due = shiftYear(work.dueAt,years);
    const opening = work.opensAt ? shiftYear(work.opensAt,years) : new Date(due.getTime());
    if (!work.opensAt) { opening.setDate(opening.getDate()-1); opening.setHours(0,1,0,0); }
    if (opening >= due) opening.setTime(due.getTime() - (Date.parse(work.dueAt) - Date.parse(work.opensAt)));
    return {id:newId(), subject:target.id, title:work.title, opensAt:opening.toISOString(),
      dueAt:due.toISOString(), sequential:Boolean(work.sequential), review:Boolean(work.review), activities};
  });
  return {...current, copiedSubjects:[...(current.copiedSubjects ?? []),{...target,bankId}],works:[...current.works,...copies]};
}

// Embedded quizzes from older works acquire one bank record on the first copy.
export function copyWorkLibrary(current, source, settings) {
  const questions = [...current.questions];
  const activities = source.activities.map(item => {
    if (item.kind === "quiz") {
      let quiz = item.quizId
        ? questions.find(row => row.id === item.quizId)
        : questions.find(row => row.sourceWorkId === source.id && row.sourceActivityId === item.id);
      if (!quiz && !item.quizId) {
        quiz = {...item,id:newId(),taskIds:[],sourceWorkId:source.id,sourceActivityId:item.id};
        questions.push(quiz);
      }
      if (quiz?.kind !== "quiz") throw Error("Тест отсутствует в банке.");
      return {id:newId(),quizId:quiz.id};
    }
    const taskId = item.taskId ?? item.id;
    if (!current.tasks.some(task => task.id === taskId)) {
      throw Error("Задача отсутствует в банке.");
    }
    return {id:newId(),taskId};
  });
  const copy = {...settings, id:newId(), subject:source.subject, usesBankReferences:true, activities};
  const works = current.works.map(work => {
    if (work.id !== source.id) return work;
    return {...work,activities:work.activities.map((item,index) =>
      item.kind === "quiz" && !item.quizId ? {...item,quizId:activities[index].quizId} : item)};
  });
  return {...current,questions,works:[...works,copy]};
}
