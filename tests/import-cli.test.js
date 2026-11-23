import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtemp, mkdir, readFile, writeFile, copyFile, symlink, rm, readdir} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {currentSemester} from "../src/semester.js";

test("CLI imports linked files atomically and releases the lock after failure", async t => {
  const dir = await mkdtemp(join(tmpdir(), "contest-import-"));
  t.after(() => rm(dir, {recursive:true, force:true}));
  // Only the CLI and its generated data need isolated paths. Modules run from the repository.
  await mkdir(join(dir,"scripts"));
  await mkdir(join(dir,"src"));
  await writeFile(join(dir,"package.json"), JSON.stringify({type:"module"}));
  await copyFile(new URL("../scripts/import-json.js", import.meta.url), join(dir,"scripts/import-json.js"));
  for (const name of ["importData.js","activityData.js","data.js"]) {
    await symlink(new URL("../src/"+name, import.meta.url), join(dir,"src",name));
  }

  const seed = join(dir,"src/imported-data.json");
  const original = JSON.stringify({subjects:[],tasks:[],questions:[],works:[]});
  await writeFile(seed,original);
  const academicYear = currentSemester().academicYear;
  const [start,end] = academicYear.split("/");
  await writeFile(join(dir,"subjects.json"), JSON.stringify({subjects:[
    {id:"course",title:"Курс",academicYear,semesterNumber:1},
  ]}));
  await writeFile(join(dir,"bank.json"), "\uFEFF" + JSON.stringify({
    tasks:[{id:"task",subject:"course",title:"Задача",prompt:"Условие"}],
    questions:[{title:"Вопрос",subject:"course",prompt:"Почему?",taskIds:["task"]}],
  }));
  const work = {subject:"course",title:"Работа",opensAt:start+"-09-01T00:01",dueAt:end+"-08-31T23:59"};
  const workFile = join(dir,"works.json");
  const run = () => spawnSync(process.execPath, ["scripts/import-json.js","subjects.json","bank.json","works.json"], {cwd:dir, encoding:"utf8"});
  await writeFile(workFile, JSON.stringify({works:[{...work, activities:[{taskId:"missing"}]}]}));
  const failed = run();
  assert.equal(failed.status,1,failed.stderr);
  assert.match(failed.stderr,/works\.json: works\.0\.activities\.0/);
  assert.equal(await readFile(seed,"utf8"),original);

  await writeFile(workFile, JSON.stringify({works:[{...work, activities:[{taskId:"task"}]}]}));
  const success = run();
  assert.equal(success.status,0,success.stderr);
  const saved = await readFile(seed,"utf8");
  const db = JSON.parse(saved);
  assert.equal(db.subjects[0].id,"course");
  assert.ok(!Object.hasOwn(db.tasks[0],"subject"));
  assert.deepEqual(db.questions[0].taskIds,["task"]);
  assert.equal(db.works[0].activities[0].taskId,"task");
  const retry = run();
  assert.equal(retry.status,1);
  assert.match(retry.stderr,/subjects\.0\.id/);
  assert.equal(await readFile(seed,"utf8"),saved);
  assert.deepEqual((await readdir(join(dir,"src"))).filter(n => /\.(lock|tmp)$/.test(n)),[]);
});
