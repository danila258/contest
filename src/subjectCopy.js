import {newId} from "./newId.js";
import {academicYearOf, currentSemester} from "./semester.js";
import {newActivity} from "./activityData.js";

export const bankIdOf = subject => subject?.bankId ?? subject?.id;

export function subjectOptionTitle(subject, subjects) {
  return subjects.some(other => other.id !== subject.id && other.title === subject.title)
    ? `${subject.title} · ${academicYearOf(subject) ?? "Год не указан"}` : subject.title;
}

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
    item.kind === "program" ? {id:item.id,taskId:item.taskId} : item)};
}

export function resolveWorkTasks(work, tasks, start) {
  if (start?.activities) return {...work,activities:start.activities};
  if (!work?.activities?.some(item => item.taskId && !item.kind)) return work;
  return {...work, activities:work.activities.map(item => {
    if (!item.taskId || item.kind) return item;
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
      if (item.kind === "quiz") return {...structuredClone(item),id};
      const taskId = item.taskId ?? item.id;
      if (!current.tasks.some(task => task.id === taskId && task.subject === bankId)) {
        throw Error(`Задача «${item.title ?? work.title}» отсутствует в банке предмета.`);
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
