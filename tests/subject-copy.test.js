import assert from "node:assert/strict";
import test from "node:test";
import {copySubjectLibrary,resolveWorkTasks} from "../src/subjectCopy.js";
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

test("shared bank links work in JSON import and remain scoped to the course",()=>{
  const data={works:[{title:"Импорт",subject:target.id,opensAt:"2028-09-01T09:00",dueAt:"2029-05-01T10:00",activities:[{taskId:task.id}]}]};
  assert.equal(readWorks(data,[target],target.id,original,[]).works[0].activities[0].taskId,task.id);
  assert.throws(()=>readWorks(data,[{...target,bankId:"other"}],target.id,original,[]),/отсутствует/);
  const added=readBank({tasks:[{title:"Новая",prompt:"Условие"}]},[target],target.id,original);
  assert.equal(added.tasks[0].subject,source.id);
});
