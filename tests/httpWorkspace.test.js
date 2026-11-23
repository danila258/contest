import assert from "node:assert/strict";
import test from "node:test";
import {collectTasks} from "../src/activityData.js";

test("opening a fresh workspace works on an HTTP origin without randomUUID", t => {
  t.mock.method(crypto, "randomUUID", () => {});
  Object.defineProperty(crypto, "randomUUID", {configurable:true, value:undefined});
  const tasks = collectTasks([]);
  assert.ok(tasks.length > 0);
  for (const task of tasks) {
    assert.match(task.cases[0].id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  }
});
