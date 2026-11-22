import React, { useState } from "react";
import { settings as dateSettings } from "@gravity-ui/date-utils";
import { createRoot } from "react-dom/client";
import {
  Button,
  Card,
  Label,
  Table,
  Text,
  TextInput,
  Icon,
  Select,
  Toaster,
  ToasterProvider,
  ToasterComponent,
} from "@gravity-ui/uikit";
import {
  BookOpen,
  ChevronRight,
  Code,
  ListUl,
  ArrowLeft,
} from "@gravity-ui/icons";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import "./style.css";
import { subjects as demoSubjects, works as demoWorks, deadline, starter } from "./data";

import { SubjectCover, coverSettings } from "./SubjectCover";
import { academicYearOf, currentSemester, inCurrentSemester, semesterLabel } from "./semester";
import {JsonImport} from "./JsonImport";
import {readSubjects, readWorks, readWorkDraft} from "./importData";
import { SubjectFilter } from "./SubjectFilter";
import { SubjectGroups } from "./SubjectGroups";
import { AssignmentForm } from "./AssignmentForm";
import {collectTasks} from "./activityData";
import imported from "./imported-data.json";
import { TaskBank } from "./TaskBank";
import {alreadyStarted, editInProgress, withWorkAccess, workHasStarted, useWorkBusy} from "./workAccess";
import {WorkStart} from "./WorkStart";
import { AssignmentDetails } from "./AssignmentDetails";
import { AppearanceProvider, AppearanceSettings } from "./Appearance";
import { WorkspacePage } from "./WorkspacePage";
import {demoGroup, demoTeacher} from "./subjectOptions";
import {bankIdOf, copySubjectLibrary, referenceWorkTasks, resolveWorkTasks} from "./subjectCopy";
import { SubjectSettings } from "./SubjectSettings";

import { WorkspaceNavigation } from "./WorkspaceNavigation";

import MarkdownContent from "./MarkdownContent";
import TeacherActivityPreview from "./TeacherActivityPreview";

const subjects = [...demoSubjects,...imported.subjects];

function withImportedData(local) {
  const merged = {...local};
  for (const key of ["tasks","questions","works"]) {
    const ids = new Set(local[key].map(row => row.id));
    merged[key] = [...imported[key].filter(row => !ids.has(row.id)),...local[key]];
  }
  return merged;
}

const CodeEditor = React.lazy(() => import("./CodeEditor"));

const deadlineOf = work => Date.parse(work.dueAt);
const workDate = work => new Date(work.dueAt).toLocaleString("ru-RU", {dateStyle:"short", timeStyle:"short"});
const ico = (data, size = 18) => <Icon data={data} size={size} />;
const opts = (labels) => labels.map((value) => ({ value, content: value }));
function useLocal(key, initial) {
  const [value, set] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? initial;
    } catch {
      return initial;
    }
  });
  React.useEffect(() => {
    if (!["practice.starts","practice.library","practice.attempts","practice.drafts"].includes(key)) return;
    function sync(event) {
      if (event.key === key && event.newValue !== null) set(JSON.parse(event.newValue));
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key]);
  return [
    value,
    (next) => {
      localStorage.setItem(key, JSON.stringify(next));
      set(next);
    },
  ];
}
const statusThemes = {
  "В работе": "info",
  Зачтено: "success",
  Отправлено: "info",
  "На доработке": "warning",
};
function App() {
  const [page, pageSet] = useState("Обзор"),
    [selected, select] = useState(null),
    [filter, filterSet] = useState("Все статусы");
  const [role, roleSet] = useLocal("practice.role", "Студент"),
    [extra, saveExtra] = useLocal("practice.subjects", []);
  const [starts,saveStarts] = useLocal("practice.starts", {});
  const [drafts, saveDrafts] = useLocal("practice.drafts", {}),
    [attempts, saveAttempts] = useLocal("practice.attempts", {});
  const [active, open] = useState(null),
    [settingsOpen, showSettings] = useState(false);
  const [legacyWorks] = useLocal("practice.works", []);
  const [library, saveLibrary] = useLocal("practice.library", null);
  const initialLibrary = React.useMemo(() => ({
    works: legacyWorks.map(work => ({...work, activities:work.activities?.map(item =>
      item.kind === "program" ? {...item, taskId:item.taskId ?? item.id} : item)})),
    tasks: collectTasks(legacyWorks),
    questions: [],
  }), [legacyWorks]);
  const bank = React.useMemo(() => withImportedData(library ?? initialLibrary), [library, initialLibrary]);
  function updateLibrary(change) {
    const stored = localStorage.getItem("practice.library");
    saveLibrary(change(stored ? withImportedData(JSON.parse(stored)) : bank));
  }
  const savedWorks = React.useMemo(() => bank.works.map(w => resolveWorkTasks(w,bank.tasks,starts[w.id])), [bank,starts]);
  const bankTasks = bank.tasks;
  const [creatingWork, setCreatingWork] = useState(false);
  const releaseEditor = React.useRef(null);
  const busy = useWorkBusy(active?.id);
  const [editFailure, setEditFailure] = useState(null);
  function closeForm() {
    releaseEditor.current?.();
    releaseEditor.current = null;
    setCreatingWork(false);
  }
  React.useEffect(() => {
    window.addEventListener("pagehide", closeForm);
    return () => { window.removeEventListener("pagehide", closeForm); releaseEditor.current?.(); };
  }, []);
  React.useEffect(() => {
    if (!creatingWork && active?.activities) {
      const latest = savedWorks.find(work => work.id === active.id);
      if (latest && latest !== active) open(latest);
    }
  }, [active, savedWorks, creatingWork]);
  async function editWork() {
    try {
      setEditFailure(null);
      await withWorkAccess(active.id, () => {
        if (workHasStarted(active)) throw new Error(alreadyStarted);
        return new Promise(resolve => {
          releaseEditor.current = resolve;
          setCreatingWork(true);
        });
      });
    } catch (error) { setEditFailure({id:active.id, message:error.message}); }
  }
  const [workSubject,setWorkSubject] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [subjectYear, setSubjectYear] = useState("");
  const [workQuery,setWorkQuery] = useState("");
  const catalogue = page === "Практические работы";
  const [datedDemoWorks] = useState(() => demoWorks.map(work => {
    const due = deadline(work.day);
    due.setHours(23, 59, 0, 0);
    return {...work, dueAt:due.toISOString()};
  }));
  const works = [...datedDemoWorks, ...savedWorks];
  const [now, setNow] = useState(Date.now);
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);
  const teacher = role === "Преподаватель";
  // Old demo records were visible to both profiles before access settings existed.
  const savedIds = new Set(extra.map((s) => s.id));
  const baseSubjects = [...subjects,...(bank.copiedSubjects ?? [])];
  const all = [...baseSubjects.filter(s => !savedIds.has(s.id)), ...extra].filter(
    (s) =>
      teacher
        ? s.teacher === demoTeacher ||
          !s.teachers ||
          s.teachers.includes(demoTeacher)
        : !s.groups || s.groups.includes(demoGroup),
  );
  const current = currentSemester();
  const listedSubjects = page === "Обзор"
    ? all.filter(s => inCurrentSemester(s, current))
    : all;
  const subject = (id) => listedSubjects.find((s) => s.id === id);
  function state(work) {
    const availability = deadlineOf(work) <= now ? "Срок истёк" : "Доступна";

    const result = attempts[work.id]?.at(-1)?.status;
    if (result) return result;
    if (availability === "Срок истёк" && work.state !== "Зачтено") return availability;
    if (Object.hasOwn(starts, work.id) || Object.hasOwn(drafts, work.id)) return "В работе";
    return work.state === "Доступна" ? availability : work.state ?? availability;
  }
  const overview = page === "Обзор";
  const visibleWorks = works.filter(w => {
    if (!subject(w.subject)) return false;
    const opened = !w.opensAt || Date.parse(w.opensAt) <= now;
    return opened && ((!teacher && !overview) || deadlineOf(w) > now);
  });
  if (overview) visibleWorks.sort((a, b) => deadlineOf(a) - deadlineOf(b));
  const displayWorks = visibleWorks.filter(
    (w) =>
      (!selected || w.subject === selected.id) &&
      (!catalogue || ((!workSubject || w.subject === workSubject) && w.title.toLowerCase().includes(workQuery.trim().toLowerCase()))) &&
      (filter === "Все статусы" || filter === state(w)),
  );
  function go(next, s = null) {
    if (next !== "Предметы") {
      setSubjectQuery("");
      setSubjectYear("");
    }
    setWorkSubject("");
    setWorkQuery("");
    pageSet(next);
    select(s);
    filterSet("Все статусы");
  }
  const returnAction = {
    label: selected ? "К предмету" : overview ? "К обзору" : "К работам",
    onClick: () => open(null),
  };
  function submit() {
    const submittedAt = Date.now();
    if (submittedAt >= deadlineOf(active)) {
      setNow(submittedAt);
      return;
    }
    const answer = drafts[active.id] ?? (active.question ? "" : starter);
    const status = active.question
      ? answer === active.correct
        ? "Зачтено"
        : "На доработке"
      : "Отправлено";
    saveAttempts({
      ...attempts,
      [active.id]: [
        ...(attempts[active.id] || []),
        { answer, status, time: new Date(submittedAt).toISOString() },
      ],
    });
  }
  function saveSubject(settings) {
    if (settingsOpen === "copy") {
      const copy = {...settings,id:crypto.randomUUID(),teacher:demoTeacher,bankId:bankIdOf(selected)};
      updateLibrary(current => copySubjectLibrary(current,selected,copy,datedDemoWorks));
      showSettings(false);
      go("Предметы",copy);
      return;
    }
    const base = selected ?? {
      id: crypto.randomUUID(),
      teacher: demoTeacher,
    };
    const saved = { ...base, ...settings };
    delete saved.season;
    delete saved.year;
    saveExtra([...extra.filter((s) => s.id !== saved.id), saved]);
    showSettings(false);
    go("Предметы", saved.teachers.includes(demoTeacher) ? saved : null);
  }
  if (creatingWork && teacher) {
    return <AssignmentForm initialWork={active} subject={active ? subject(active.subject) : selected} subjects={all} initialSubjectId={workSubject} bankTasks={bankTasks}
      onImport={(data, fallback) => readWorkDraft(data,selected ? [selected] : all,fallback,bank,demoWorks)}
      onClose={closeForm} onSave={work => {
      if (active && workHasStarted(active)) throw new Error(alreadyStarted);
      const workBankId = bankIdOf(all.find(s => s.id === work.subject));
      const newTasks = work.activities.filter(item => item.kind === "program" && !item.taskId)
        .map(item => ({...item, subject:workBankId}));
      const activities = work.activities.map(item => item.kind === "program"
        ? {...item, taskId:item.taskId ?? item.id} : item);
      const saved = {...active,...work,activities};
      updateLibrary(current => {
        const existing = current.works.find(w => w.id === work.id);
        if (active && JSON.stringify(resolveWorkTasks(existing,current.tasks)) !== JSON.stringify(active)) {
          throw Error("Работа изменилась в другой вкладке. Обновите страницу и снова откройте работу для редактирования.");
        }
        if (!active && existing) throw Error(`Работа с ID «${work.id}» уже существует.`);
        const record = workBankId === work.subject ? saved : referenceWorkTasks(saved);
        return {...current, tasks:[...current.tasks,...newTasks], works:active ? current.works.map(w => w.id === work.id ? record : w) : [...current.works,record]};
      });
      if (active) open(saved);
      if (!active && catalogue) {
        if (workSubject) setWorkSubject(work.subject);
        setWorkQuery("");
      }
      setNow(Date.now());
      closeForm();
      filterSet("Все статусы");
    }}/>;
  }
  if (active && !teacher && !Object.hasOwn(starts,active.id) && !Object.hasOwn(drafts,active.id)
      && !attempts[active.id]?.length && active.state !== "Зачтено") {
    return <WorkStart work={active} subject={subject(active.subject)} now={now} returnAction={returnAction}
      busy={busy} onStart={() => withWorkAccess(active.id, () => navigator.locks.request("practice.starts", () => {
        const time = Date.now();
        setNow(time);
        const storedLibrary = JSON.parse(localStorage.getItem("practice.library"));
        const latest = storedLibrary?.works.find(w => w.id === active.id);
        if (latest && JSON.stringify(resolveWorkTasks(latest,withImportedData(storedLibrary).tasks)) !== JSON.stringify(active)) throw new Error("Условия работы изменились. Ознакомьтесь с ними перед началом.");
        if (time < Date.parse(active.opensAt)) throw new Error("Время открытия работы ещё не наступило.");
        if (time >= deadlineOf(active) || active.activities?.length === 0) return;
        const saved = JSON.parse(localStorage.getItem("practice.starts")) ?? starts;
        const startedAt = new Date(time).toISOString();
        const start = latest?.activities?.some(item => item.taskId && !item.kind)
          ? {startedAt,activities:active.activities} : startedAt;
        saveStarts({...saved,[active.id]:saved[active.id] ?? start});
      }))}/>;
  }
  if (active?.activities) {
    return <AssignmentDetails work={active} subject={subject(active.subject)} teacher={teacher} onEdit={editWork}
      editBlocked={teacher && (workHasStarted(active) ? alreadyStarted : busy ? editInProgress : "")}
      editError={editFailure?.id === active.id ? editFailure.message : ""} returnAction={returnAction}/>;
  }
  if (settingsOpen && teacher) {
    return (
      <SubjectSettings
        subject={selected}
        copying={settingsOpen === "copy"}
        onSave={saveSubject}
        onClose={() => showSettings(false)}
      />
    );
  }
  if (active) {
    return (
      <WorkspacePage title={active.title} returnAction={returnAction}>
        <div className="activity">
          <small>
            {subject(active.subject).title} · Сдать до {workDate(active)}
          </small>
          {teacher ? <TeacherActivityPreview item={active.question ? {
            kind:"quiz", questions:[{id:active.id, prompt:active.question, answers:active.answers.map((text,i) =>
              ({id:i,text,correct:text === active.correct}))}],
          } : {kind:"program",prompt:active.task,sources:{"main.cpp":starter}}}/> :
            <MarkdownContent source={active.question || active.task}/>}
          {teacher ? (
            <>
              <h3>Попытки Анны Смирновой</h3>
              {!attempts[active.id]?.length && (
                <p>Новых демонстрационных попыток нет.</p>
              )}
              {attempts[active.id]?.map((a, i) => (
                <div key={a.time}>
                  <b>
                    Попытка {i + 1} · {a.status}
                  </b>
                  <pre>{a.answer}</pre>
                </div>
              ))}
            </>
          ) : (
            <>
              {active.question ? (
                <Select
                  aria-label="Ответ"
                  placeholder="Выберите ответ"
                  value={drafts[active.id] ? [drafts[active.id]] : []}
                  options={opts(active.answers)}
                  onUpdate={(v) => saveDrafts({ ...drafts, [active.id]: v[0] })}
                />
              ) : (
                <div>
                  <div>main.cpp</div>
                  <React.Suspense
                    fallback={<p role="status">Загрузка редактора…</p>}
                  >
                    <CodeEditor
                      key={active.id}
                      initialValue={drafts[active.id] ?? starter}
                      onChange={(value) =>
                        saveDrafts({ ...drafts, [active.id]: value })
                      }
                    />
                  </React.Suspense>
                </div>
              )}
              <p className="note">
                Демо · ответы сохраняются в этом браузере.
                {!active.question && " Проверка C++ недоступна."}
              </p>
              {attempts[active.id]?.length > 0 && (
                <p role="status">Последняя попытка: {state(active)}</p>
              )}
              {now >= deadlineOf(active) ? <p role="status">Срок сдачи истёк.</p> : (
                <Button
                  view="action"
                  disabled={active.question && !drafts[active.id]}
                  onClick={submit}
                >
                  {active.question
                    ? "Проверить ответ"
                    : "Сохранить демо-отправку"}
                </Button>
              )}
            </>
          )}
        </div>
      </WorkspacePage>
    );
  }
  const renderCards = (items) => (
    <div className="cards">
      {items.map((s) => (
        <Card
          type="action"
          className="card"
          onClick={() => go("Предметы", s)}
          key={s.id}
        >
          <SubjectCover {...coverSettings(s)} />
          <div className="cardText">
            <h3>{s.title}</h3>
            <span>{s.teacher} · {semesterLabel(s)}</span>
            {teacher && <SubjectGroups groups={s.groups ?? [demoGroup]} />}
            <div className="cardFoot">
              <span>
                {ico(BookOpen, 15)} Работы:{" "}
                {visibleWorks.filter((w) => w.subject === s.id).length}
              </span>
              {ico(ChevronRight, 16)}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
  const table = (
      <Table
        aria-label="Практические работы"
        width="max"
        verticalAlign="middle"
        wordWrap
        data={displayWorks}
        getRowDescriptor={(w) => ({ id: w.id })}
        onRowClick={open}
        emptyMessage={catalogue && (workQuery.trim() || workSubject || filter !== "Все статусы") ? "По выбранным условиям работ нет." : overview && filter === "Все статусы" ? "Сейчас нет работ, доступных для сдачи." : "Работ пока нет."}
        columns={[
          {
            id: "title",
            name: "Название",
            template: (w) => (
              <div className="workName">
                <Button
                  view="flat"
                  onClick={(e) => {
                    e.stopPropagation();
                    open(w);
                  }}
                >
                  <Icon data={w.activities ? BookOpen : w.question ? ListUl : Code} />
                  {w.title}
                </Button>
                <Text variant="caption-2" color="secondary">
                  {subject(w.subject).title}
                </Text>
              </div>
            ),
          },
          {id: "deadline", name: "Сдать до", template: workDate},
          ...(teacher ? [] : [{
            id: "status",
            name: "Статус",
            template: (w) => (
              <Label theme={statusThemes[state(w)] ?? "normal"}>
                {state(w)}
              </Label>
            ),
          }]),
        ]}
      />
  );
  const filters = (
    <Select
      aria-label="Статус работы"
      value={[filter]}
      options={opts([
        "Все статусы",
        ...(!overview ? ["Срок истёк"] : []),
        "Доступна",
        "В работе", "Зачтено", "Отправлено", "На доработке",
      ])}
      onUpdate={(v) => filterSet(v[0])}
    />
  );
  const renderWorkspace = content => (
    <WorkspaceNavigation page={page} go={go} teacher={teacher}>
      <main className="workspace">
        <header className="workspaceHeader">
          {selected && (
            <Button view="flat" onClick={() => go("Предметы")}>
              {ico(ArrowLeft)} Все предметы
            </Button>
          )}
          <AppearanceSettings/>
          <Select
            aria-label="Демонстрационная роль"
            value={[role]}
            options={opts(["Студент", "Преподаватель"])}
            onUpdate={(v) => {
              roleSet(v[0]);
              go("Обзор");
            }}
          />
        </header>
        {content}
      </main>
    </WorkspaceNavigation>
  );
  if (teacher && page === "Банк задач и тестов") {
    return <TaskBank subjects={all} tasks={bankTasks} bank={bank} save={updateLibrary} renderWorkspace={renderWorkspace}/>;
  }
  if (catalogue) {
    return renderWorkspace(<article className="bankPage">
      <h1>Практические работы</h1>
      <div className="assignmentControls">
        <SubjectFilter subjects={all} value={workSubject} onChange={setWorkSubject}/>
        {!teacher && filters}
        {teacher && <Button view="action" disabled={!all.length} onClick={() => setCreatingWork(true)}>
          Создать практическую работу
        </Button>}
      </div>
      <TextInput controlProps={{"aria-label":"Поиск по практическим работам"}} placeholder="Найти по названию работы"
        value={workQuery} onUpdate={setWorkQuery} hasClear/>
      {teacher && <JsonImport key="works" template="works" onImport={data => {
        let count;
        updateLibrary(current => {
          const added = readWorks(data,all,workSubject,current,demoWorks);
          count = added.works.length;
          const records = added.works.map(w => bankIdOf(subject(w.subject)) === w.subject ? w : referenceWorkTasks(w));
          return {...current, works:[...current.works,...records], tasks:[...current.tasks,...added.tasks]};
        });
        setNow(Date.now());
        return count;
      }}/>}
      {table}
    </article>);
  }
  const subjectAction = teacher && (
    <Button view={selected ? "outlined" : "action"} onClick={() => showSettings(true)}>
      {selected ? "Настройки предмета" : "Создать предмет"}
    </Button>
  );
  if (page === "Предметы" && !selected) {
    const years = [...new Set(all.map(academicYearOf).filter(Boolean))].sort().reverse();
    const query = subjectQuery.trim().toLowerCase();
    const matches = all.filter(s =>
      (!subjectYear || academicYearOf(s) === subjectYear) && s.title.toLowerCase().includes(query)
    );
    return renderWorkspace(<article className="bankPage">
      <h1>Предметы</h1>
      <div className="assignmentControls">
        <Select aria-label="Учебный год" filterable value={[subjectYear]}
          options={[{value:"", content:"Все учебные годы"}, ...opts(years)]}
          onUpdate={([year]) => setSubjectYear(year)}/>
        {subjectAction}
      </div>
      <TextInput controlProps={{"aria-label":"Поиск по предметам"}} placeholder="Найти по названию предмета"
        value={subjectQuery} onUpdate={setSubjectQuery} hasClear/>
      {teacher && <JsonImport key="subjects" template="subjects" onImport={data => {
        const stored = JSON.parse(localStorage.getItem("practice.subjects")) ?? extra;
        const added = readSubjects(data,[...baseSubjects,...stored]);
        saveExtra([...stored,...added]);
        return added.length;
      }}/>}
      {matches.length ? renderCards(matches) : <p role="status">
        {query || subjectYear ? "По выбранным условиям предметов нет." : "Предметов пока нет."}
      </p>}
    </article>);
  }
  return renderWorkspace(<article>
          <div className="title">
            <div>
              <h1>
                {selected?.title || page}
              </h1>
              <p>
                {selected
                  ? selected.teacher + " · " + semesterLabel(selected)
                  : page === "Обзор"
                    ? (current.season === "spring" ? "Весна" : "Осень") + " · " + current.academicYear
                    : page === "Предметы"
                      ? "Доступные предметы за все семестры."
                      : "Задания по всем предметам."}
              </p>
            </div>
            {selected && teacher && <div className="assignmentControls">
              <Button view="outlined" onClick={() => showSettings("copy")}>Копировать предмет</Button>
              {subjectAction}
            </div>}
          </div>
          {!selected && (
            <section>
              {page === "Обзор" && (
                <div className="sectionTitle">
                  <h2>
                    Предметы <Label size="xs">{listedSubjects.length}</Label>
                  </h2>
                  <Button view="flat" onClick={() => go("Предметы")}>
                    Все предметы
                    <Icon data={ChevronRight} />
                  </Button>
                </div>
              )}
              {listedSubjects.length ? renderCards(listedSubjects) : <p>Предметов пока нет.</p>}
            </section>
          )}
          {(overview || selected) && (
            <section className={overview ? "overviewWorks" : undefined}>
              <div className="sectionTitle">
                <h2>Практические работы</h2>
                <div className="assignmentControls">{!teacher && filters}
                  {overview && <Button view="flat" onClick={() => go("Практические работы")}>
                    Все практические работы
                    <Icon data={ChevronRight} />
                  </Button>}
                  {teacher && selected && <Button view="action" onClick={() => setCreatingWork(true)}>
                    Создать практическую работу
                  </Button>}
                </div>
              </div>
              <Card className="workList">{table}</Card>
            </section>
          )}
          {selected && (
            <div className="subjectInfo">
              {[
                ["Описание и критерии оценивания", selected.description],
                ["Частые вопросы и ответы", selected.faq],
                [
                  "Критерии приёма работ для преподавателей",
                  teacher && selected.review,
                ],
              ].map(
                ([label, body]) =>
                  body && (
                    <Card key={label}>
                      <h2>{label}</h2>
                      <MarkdownContent source={body} />
                    </Card>
                  ),
              )}
            </div>
          )}
        </article>);
}
async function renderApp() {
  await dateSettings.loadLocale("ru");
  dateSettings.setLocale("ru");
  createRoot(document.querySelector("#root")).render(
    <AppearanceProvider>
      <ToasterProvider toaster={new Toaster()}>
        <App />
        <ToasterComponent />
      </ToasterProvider>
    </AppearanceProvider>,
  );
}

renderApp();
