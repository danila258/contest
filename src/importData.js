import {z} from "zod";
import {ru} from "zod/locales";
import {academicYearOf, academicYearOptions, currentSemester, validAcademicYear} from "./semester.js";
import {defaultChecks, programModes, savedActivity} from "./activityData.js";
import {starter} from "./data.js";
import {colors, iconNames, demoGroup, demoTeacher, groups, students, teachers} from "./subjectOptions.js";

const object = z.strictObject;
const text = z.string();
const nonblank = text.refine(value => value.trim().length > 0, "Введите непустую строку.");
const title = text.trim().min(1);
const id = title.refine(value => !Object.hasOwn(Object.prototype,value), "Недопустимый идентификатор.");
import {newId} from "./newId.js";
const key = id.optional().default(newId);
const positive = z.union([z.number(), text.regex(/^[1-9]\d*$/).transform(Number)]).pipe(z.int().positive());
const minutes = positive.transform(String);
const flag = z.boolean().default(false);

function parse(schema, data) {
  const result = schema.safeParse(data, {error:ru().localeError});
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  throw Error(`${issue.path.join(".") || "JSON"} — ${issue.message}`);
}

function uniqueId(ids, value, path) {
  if (ids.has(value)) throw Error(`${path} — идентификатор «${value}» уже используется.`);
  ids.add(value);
}

function resolveSubject(row, fallback, subjects, path) {
  const subject = subjects.find(s => s.id === (row.subject ?? fallback));
  if (!subject) throw Error(`${path}.subject — укажите ID доступного предмета или выберите предмет в фильтре.`);
  return subject;
}

const subjectSchema = object({
  id:key, title, semesterNumber:positive.pipe(z.number().max(12)), academicYear:title.refine(validAcademicYear),
  color:z.enum(Object.keys(colors)).default("blue"), icon:z.enum(iconNames).default("code"),
  studentIds:z.array(z.enum(students.map(student => student.id))).default([]),
  groups:z.array(z.enum(groups)).default([demoGroup]), teachers:z.array(z.enum(teachers)).default([]),
  description:text.default(""), faq:text.default(""), review:text.default(""),
});

export function readSubjects(data, existing) {
  const {subjects} = parse(object({_comment:text.optional(), subjects:z.array(subjectSchema).min(1)}),data);
  const ids = new Set(existing.map(s => s.id));
  const years = academicYearOptions(currentSemester().academicYear).map(option => option.value);
  return subjects.map((s,i) => {
    uniqueId(ids,s.id,`subjects.${i}.id`);
    if (!years.includes(s.academicYear)) throw Error(`subjects.${i}.academicYear — доступные годы: ${years.join(", ")}.`);
    return {...s, teacher:demoTeacher, studentIds:[...new Set(s.studentIds)], teachers:[...new Set([demoTeacher,...s.teachers])], groups:[...new Set(s.groups)]};
  });
}

const severity = z.enum(["off","warn","block"]);
const stdoutCase = object({input:text,output:text});
const unitCase = object({code:nonblank});
const programFields = {
  title, prompt:nonblank, mode:z.enum(Object.keys(programModes)).default("stdout"),
  sources:object({"main.cpp":text.default(starter),"task_name.cpp":text.optional(),"task_name.h":text.optional()}).prefault({}),
  cases:z.array(z.union([stdoutCase,unitCase])).optional(),
  reference:text.default(""), minutes:z.union([minutes,z.literal("")]).default(""), logs:flag,
  checks:object({format:severity.default(defaultChecks.format),static:severity.default(defaultChecks.static),dynamic:severity.default(defaultChecks.dynamic)}).prefault({}),
};

function program(row, path) {
  const cases = row.cases ?? (row.mode === "stdout" ? [{input:"",output:""}] : []);
  if (row.mode === "none") {
    if (cases.length) throw Error(`${path}.cases — для режима «Без тестов» оставьте список пустым.`);
    return savedActivity({...row, id:row.id ?? newId(), kind:"program"});
  }
  if (!cases.length || cases.some(c => row.mode === "unit" ? !("code" in c) : !("output" in c))) {
    throw Error(`${path}.cases — проверки должны соответствовать режиму ${row.mode}.`);
  }
  return {...row, id:row.id ?? newId(), kind:"program", cases:cases.map(c => ({id:newId(),input:"",output:"",code:"",...c}))};
}

const bankSchema = object({
  _comment:text.optional(),
  tasks:z.array(object({id:key, subject:id.optional(), ...programFields})).default([]),
  questions:z.array(object({id:key, subject:id.optional(), title, prompt:nonblank, taskIds:z.array(id).default([])})).default([]),
});

function linkedTask(tasks, taskId, path) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) throw Error(`${path} — задача «${taskId}» отсутствует в банке.`);
  return task;
}

export function readBank(data, current) {
  const rows = parse(bankSchema,data);
  if (!rows.tasks.length && !rows.questions.length) throw Error("Добавьте хотя бы одну задачу или теоретический вопрос.");
  const ids = new Set(current.tasks.map(t => t.id));
  const tasks = rows.tasks.map(({subject, ...row},i) => {
    const path = `tasks.${i}`;
    uniqueId(ids,row.id,path + ".id");
    return program(row,path);
  });
  const allTasks = [...current.tasks,...tasks];
  const questionIds = new Set(current.questions.map(q => q.id));
  const questions = rows.questions.map(({subject, ...q},i) => {
    const path = `questions.${i}`;
    uniqueId(questionIds,q.id,path + ".id");
    for (const taskId of q.taskIds) linkedTask(allTasks,taskId,path + ".taskIds");
    return {...q, kind:"theory", taskIds:[...new Set(q.taskIds)]};
  });
  return {tasks,questions};
}

const answer = object({text:nonblank, correct:flag}).transform(a => ({...a,id:newId()}));
const question = object({prompt:nonblank, minutes:minutes.default("5"), answers:z.array(answer).min(1)
  .refine(answers => answers.some(a => a.correct),"Отметьте хотя бы один правильный ответ.")}).transform(q => ({...q,id:newId()}));
const quiz = object({kind:z.literal("quiz"), title, attempts:minutes.default("1"), threshold:minutes.default("1"),
  shuffle:z.boolean().default(true), back:flag, timer:z.enum(["whole","question"]).default("whole"),
  minutes:minutes.default("30"), questions:z.array(question).min(1)});
const localDate = text.regex(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/, "Ожидается локальная дата ГГГГ-ММ-ДДTЧЧ:ММ.")
  .refine(value => {
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return false;
    return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16) === value;
  }, "Несуществующая дата или время.");
const inlineProgram = object({kind:z.literal("program"), ...programFields});
const inlineActivity = z.discriminatedUnion("kind",[quiz,inlineProgram]);

function editableActivity(activity, path) {
  if (activity.kind === "program") return program(activity,path);
  if (Number(activity.threshold) > activity.questions.length || (activity.back && activity.timer === "question")) {
    throw Error(`${path} — проверьте порог зачёта и совместимость таймера с возвратом к вопросам.`);
  }
  return {...activity,id:newId()};
}

export function readActivityDrafts(data, kind) {
  const {activities} = parse(object({_comment:text.optional(), activities:z.array(inlineActivity).min(1)}),data);
  if (kind && (activities.length !== 1 || activities[0].kind !== kind)) {
    throw Error(kind === "quiz" ? "Выберите файл с одним тестом." : "Выберите файл с одной задачей на программирование.");
  }
  return activities.map((activity,i) => editableActivity(activity,`activities.${i}`));
}

const workSchema = object({id:key, subject:id.optional(), title, description:text.default(""), opensAt:localDate, dueAt:localDate,
  sequential:z.boolean().default(true), review:z.boolean().default(true), activities:z.array(z.union([inlineActivity,object({taskId:id}),object({quizId:id})])).default([])});

export function readWorks(data, subjects, fallback, current, demoWorks) {
  const rows = parse(object({_comment:text.optional(),works:z.array(workSchema).min(1)}),data).works;
  const ids = new Set([...demoWorks,...current.works].map(w => w.id));
  const tasks = [];
  const questions = [];
  const works = rows.map((w,i) => {
    const path = `works.${i}`;
    uniqueId(ids,w.id,path + ".id");
    const subject = resolveSubject(w,fallback,subjects,path);
    const [first,last] = (academicYearOf(subject) ?? currentSemester().academicYear).split("/");
    if (w.opensAt < first+"-09-01T00:00" || w.dueAt > last+"-08-31T23:59" || w.dueAt <= w.opensAt) {
      throw Error(`${path} — даты должны входить в учебный год предмета, а сдача должна быть позже открытия.`);
    }
    const attached = new Set();
    const activities = w.activities.map((activity,j) => {
      const itemPath = path + ".activities." + j;
      if ("quizId" in activity) {
        const quiz = current.questions.find(row => row.kind === "quiz" && row.id === activity.quizId);
        if (!quiz) throw Error(`${itemPath} — тест отсутствует в банке.`);
        return {...quiz,id:newId(),quizId:quiz.id};
      }
      if ("taskId" in activity) {
        uniqueId(attached,activity.taskId,itemPath + ".taskId");
        const task = linkedTask(current.tasks,activity.taskId,itemPath);
        return {...task,id:newId(),taskId:task.id};
      }
      const item = editableActivity(activity,itemPath);
      if (item.kind === "quiz") {
        questions.push({...item,taskIds:[]});
        return {...item,quizId:item.id};
      }
      tasks.push(item);
      return {...item,taskId:item.id};
    });
    return {...w, subject:subject.id, opensAt:new Date(w.opensAt).toISOString(), dueAt:new Date(w.dueAt).toISOString(), activities};
  });
  return {works,tasks,questions};
}

export function readWorkDraft(data, subjects, fallback, current, demoWorks) {
  if (Array.isArray(data?.works) && data.works.length > 1) {
    throw Error("Для этой формы выберите файл с одной работой. Несколько работ можно импортировать в разделе «Практические работы».");
  }
  const {works:[work], tasks, questions} = readWorks(data,subjects,fallback,current,demoWorks);
  const inline = new Map([...tasks,...questions].map(item => [item.id,item]));
  return {...work, activities:work.activities.map(item => inline.get(item.taskId ?? item.quizId) ?? item)};
}
