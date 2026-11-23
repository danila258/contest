import assert from "node:assert/strict";
import test from "node:test";
import {beginAttempt, expireAttempt, finishAttempt} from "../src/studentAttempt.js";

const questions = ["first","second"].map(id => ({
  id, minutes:1, answers:[{id:"a",correct:true},{id:"b",correct:true},{id:"c",correct:false}],
}));
const quiz = {kind:"quiz",questions,threshold:2,timer:"question"};
const start = item => ({draft:beginAttempt(item,0),history:[]});

test("a quiz grades the complete selection for each question", () => {
  const state = start(quiz);
  state.draft.answers = {first:["a","b"],second:["a"]};
  const partial = finishAttempt(quiz,state,1000);
  assert.equal(partial.history[0].score,1);
  assert.equal(partial.history[0].status,"На доработке");
  state.draft.answers.second = ["b","a"];
  assert.equal(finishAttempt(quiz,state,1000).history[0].status,"Зачтено");
});

test("elapsed question timers advance on return and the work deadline submits the draft", () => {
  const state = start(quiz);
  state.draft.answers.first = ["a","b"];
  const next = expireAttempt(quiz,state,90000,61000);
  assert.equal(next.draft.index,1);
  assert.equal(next.draft.questionStarted,60000);
  const result = expireAttempt(quiz,next,90000,150000);
  assert.equal(result.draft,null);
  assert.equal(result.history[0].time,90000);
  assert.equal(result.history[0].score,1);
});

test("program submission keeps the student's edited files and awaits judging", () => {
  const program = {kind:"program",mode:"unit",sources:{"task_name.cpp":"// starter"}};
  const state = start(program);
  assert.equal(state.draft.sources["task_name.cpp"],"// starter");
  state.draft.sources["task_name.cpp"] = "// answer";
  const result = finishAttempt(program,state,100);
  assert.equal(result.history[0].draft.sources["task_name.cpp"],"// answer");
  assert.equal(result.history[0].status,"Отправлено");
  assert.equal(program.sources["task_name.cpp"],"// starter");
});
