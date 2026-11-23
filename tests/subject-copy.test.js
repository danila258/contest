import assert from "node:assert/strict";
import test from "node:test";
import {copySubjectLibrary,copyWorkLibrary,resolveWorkTasks} from "../src/subjectCopy.js";
import {readWorks,readBank} from "../src/importData.js";

const source = {id:"original",academicYear:"2027/2028"};
const target = {id:"copy",academicYear:"2028/2029",bankId:source.id};
const task = {id:"p",kind:"program",subject:source.id,title:"Задача",prompt:"Из банка"};
const work = {id:"w",title:"Работа",subject:source.id,opensAt:"2028-02-29T10:00",dueAt:"2028-03-01T12:30",
  sequential:true,review:true,activities:[{...task,taskId:"p",prompt:"Снимок"},{id:"quiz",kind:"quiz",questions:[]}]};
const original = {tasks:[task],works:[work],questions:[]};

test("copy a course and copy it again without creating bank tasks or inheriting attempts",()=>{
  const copied = copySubjectLibrary(original,source,target,[]);
  assert.equal(original.works.length,1);
  assert.equal(copied.tasks,original.tasks);
  const newWork = copied.works[1];
  assert.notEqual(newWork.id,work.id);
  assert.equal(newWork.subject,target.id);
  assert.equal(newWork.opensAt,new Date("2029-02-28T10:00").toISOString());
  assert.equal(newWork.dueAt,new Date("2029-03-01T12:30").toISOString());
  assert.equal(newWork.sequential,true);
  assert.deepEqual(Object.keys(newWork.activities[0]).sort(),["id","taskId"]);
  assert.notEqual(newWork.activities[1].id,"quiz");
  assert.equal(resolveWorkTasks(newWork,[{...task,prompt:"Новое условие"}]).activities[0].prompt,"Новое условие");
  const start = {activities:resolveWorkTasks(newWork,copied.tasks).activities};
  assert.equal(resolveWorkTasks(newWork,[{...task,prompt:"Новое условие"}],start).activities[0].prompt,"Из банка");
  const again = copySubjectLibrary(copied,target,{...target,id:"third",academicYear:"2029/2030"},[]);
  assert.equal(again.copiedSubjects[1].bankId,source.id);
  assert.equal(again.works[2].activities[0].taskId,task.id);
  assert.equal(again.tasks.length,1);
});

test("shared bank links work in JSON import across independent courses",()=>{
  const data={works:[{title:"Импорт",subject:target.id,opensAt:"2028-09-01T09:00",dueAt:"2029-05-01T10:00",activities:[{taskId:task.id}]}]};
  assert.equal(readWorks(data,[target],target.id,original,[]).works[0].activities[0].taskId,task.id);
  assert.equal(readWorks(data,[{...target,bankId:"other"}],target.id,original,[]).works[0].activities[0].taskId,task.id);
  const added=readBank({tasks:[{title:"Новая",prompt:"Условие"}]},original);
  assert.ok(!Object.hasOwn(added.tasks[0],"subject"));
});

test("assignment copies reuse both bank materials across repeated and nested copies", () => {
  const settings = {title:"Копия",description:"Темы",opensAt:work.opensAt,dueAt:work.dueAt};
  const first = copyWorkLibrary(original,work,settings,source.id);
  const copy = first.works.at(-1);
  const quizId = first.questions[0].id;
  assert.equal(first.questions.length,1);
  assert.equal(first.works[0].activities[1].quizId,quizId);
  assert.deepEqual(copy.activities.map(item => item.taskId ?? item.quizId),["p",quizId]);
  assert.notEqual(copy.id,work.id);
  assert.notEqual(copy.activities[0].id,work.activities[0].id);
  const repeated = copyWorkLibrary(first,first.works[0],settings,source.id);
  const updated = [{...first.questions[0],title:"Обновлённый тест"}];
  const resolved = resolveWorkTasks(copy,first.tasks,null,updated);
  assert.equal(resolved.activities[1].title,"Обновлённый тест");
  const nested = copyWorkLibrary(repeated,resolved,settings,source.id);
  assert.equal(nested.questions.length,1);
  assert.equal(nested.works.at(-1).activities[1].quizId,quizId);
  assert.equal(nested.tasks,original.tasks);
  assert.equal(original.questions.length,0);
});
