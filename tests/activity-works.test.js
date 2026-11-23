import assert from "node:assert/strict";
import test from "node:test";
import {worksUsingActivity} from "../src/activityData.js";

test("bank references distinguish tasks and quizzes with the same ID and include the source of a promoted quiz", () => {
  const quiz = {kind:"quiz",id:"shared",sourceWorkId:"original",sourceActivityId:"inline"};
  const inline = {kind:"quiz",id:"inline"};
  const works = [
    {id:"original",activities:[inline]},
    {id:"copy",activities:[{kind:"quiz",id:"new",quizId:"shared"}]},
    {id:"other",activities:[inline]},
    {id:"program",activities:[{kind:"program",id:"instance",taskId:"shared"}]},
    {id:"shared",task:"Старинная задача"},
  ];
  const ids = (item,owner) => worksUsingActivity(works,item,owner,[quiz]).map(w => w.id);
  assert.deepEqual(ids(quiz),["original","copy"]);
  assert.deepEqual(ids(inline,"original"),["original","copy"]);
  assert.deepEqual(ids(inline,"other"),["other"]);
  assert.deepEqual(ids({kind:"program",id:"shared"}),["program","shared"]);
  assert.deepEqual(ids({kind:"quiz",id:"unused"}),[]);
});
