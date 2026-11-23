import {readFile, writeFile, open, rename, unlink} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {readSubjects, readBank, readWorks} from "../src/importData.js";
import {collectTasks, withDemoQuizzes} from "../src/activityData.js";
import {subjects, works} from "../src/data.js";

async function main(paths) {
  if (!paths.length) throw Error("Использование: npm run import:json -- файл.json [файл.json ...]");
  const destination = fileURLToPath(new URL("../src/imported-data.json",import.meta.url));
  const lockPath = destination + ".lock";
  const lock = await open(lockPath,"wx");
  const temporary = destination + ".tmp";
  try {
    const seed = JSON.parse(await readFile(destination,"utf8"));
    let count = 0;
    for (const path of paths) {
      try {
        const data = JSON.parse((await readFile(path,"utf8")).replace(/^\uFEFF/,""));
        const available = [...subjects,...seed.subjects];
        const bank = withDemoQuizzes({...seed,tasks:[...collectTasks([]),...seed.tasks]});
        if (data?.subjects) {
          const added = readSubjects(data,available);
          seed.subjects.push(...added);
          count += added.length;
        } else if (data?.works) {
          const added = readWorks(data,available,null,bank,works);
          seed.works.push(...added.works);
          seed.tasks.push(...added.tasks);
          seed.questions.push(...added.questions);
          count += added.works.length;
        } else {
          const added = readBank(data,bank);
          seed.tasks.push(...added.tasks);
          seed.questions.push(...added.questions);
          count += added.tasks.length + added.questions.length;
        }
      } catch (error) {
        throw Error(`${path}: ${error.message}`);
      }
    }
    await writeFile(temporary,JSON.stringify(seed,null,2)+"\n");
    await rename(temporary,destination);
    console.log(`Добавлено записей: ${count}.`);
  } finally {
    await lock.close();
    await unlink(temporary).catch(error => { if (error.code !== "ENOENT") throw error; });
    await unlink(lockPath);
  }
}
main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
