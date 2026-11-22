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
  Plus,
  ArrowLeft,
} from "@gravity-ui/icons";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import "./style.css";
import { subjects, works as demoWorks, deadline, starter } from "./data";

import { SubjectCover, coverSettings } from "./SubjectCover";
import { currentSemester, inCurrentSemester, semesterLabel } from "./semester";
import { SubjectFilter } from "./SubjectFilter";
import { SubjectGroups } from "./SubjectGroups";
import { AssignmentForm } from "./AssignmentForm";
import { TaskBank, collectTasks } from "./TaskBank";
import { AssignmentDetails } from "./AssignmentDetails";
import { AppearanceProvider, AppearanceSettings } from "./Appearance";
import { WorkspacePage } from "./WorkspacePage";
import { SubjectSettings, demoGroup, demoTeacher } from "./SubjectSettings";

import { WorkspaceNavigation } from "./WorkspaceNavigation";

import MarkdownContent from "./MarkdownContent";

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
  const bank = library ?? initialLibrary;
  function updateLibrary(change) {
    const stored = localStorage.getItem("practice.library");
    saveLibrary(change(stored ? JSON.parse(stored) : bank));
  }
  const savedWorks = bank.works;
  const bankTasks = bank.tasks;
  const [creatingWork, setCreatingWork] = useState(false);
  const [workSubject,setWorkSubject] = useState("");
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
  const all = [...subjects.filter((s) => !savedIds.has(s.id)), ...extra].filter(
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
    if (Object.hasOwn(drafts, work.id)) return "В работе";
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
    setWorkSubject("");
    setWorkQuery("");
    pageSet(next);
    select(s);
    filterSet("Все статусы");
  }
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
    return <AssignmentForm subject={selected} subjects={all} initialSubjectId={workSubject} bankTasks={bankTasks} onClose={() => setCreatingWork(false)} onSave={work => {
      const newTasks = work.activities.filter(item => item.kind === "program" && !item.taskId)
        .map(item => ({...item, subject:work.subject}));
      const activities = work.activities.map(item => item.kind === "program"
        ? {...item, taskId:item.taskId ?? item.id} : item);
      updateLibrary(current => ({...current, tasks:[...current.tasks,...newTasks], works:[...current.works,{...work,activities}]}));
      if (catalogue) {
        if (workSubject) setWorkSubject(work.subject);
        setWorkQuery("");
      }
      setNow(Date.now());
      setCreatingWork(false);
      filterSet("Все статусы");
    }}/>;
  }
  if (active?.activities) {
    return <AssignmentDetails work={active} subject={subject(active.subject)} teacher={teacher} onBack={() => open(null)}/>;
  }
  if (settingsOpen && teacher) {
    return (
      <SubjectSettings
        subject={selected}
        onSave={saveSubject}
        onClose={() => showSettings(false)}
      />
    );
  }
  if (active) {
    return (
      <WorkspacePage title={active.title} onBack={() => open(null)}>
        <div className="activity">
          <small>
            {subject(active.subject).title} · Сдать до {workDate(active)}
          </small>
          <MarkdownContent source={active.question || active.task} />
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
  const cards = (
    <div className="cards">
      {listedSubjects.map((s) => (
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
  if (teacher && page === "Банк задач") {
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
      {table}
    </article>);
  }
  return renderWorkspace(<article>
          <div className="title">
            <div>
              <h1>
                {selected?.title ||
                  (page === "Обзор" ? "Обзор обучения" : page)}
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
            {teacher && (
              <Button view={selected ? "outlined" : "action"} onClick={() => showSettings(true)}>
                {!selected && (
                  <Button.Icon>
                    <Icon data={Plus} />
                  </Button.Icon>
                )}
                {selected ? "Настройки предмета" : "Создать предмет"}
              </Button>
            )}
          </div>
          {!selected && (
            <section>
              {page === "Обзор" && (
                <div className="sectionTitle">
                  <h2>
                    Мои предметы <Label size="xs">{listedSubjects.length}</Label>
                  </h2>
                  <Button view="flat" onClick={() => go("Предметы")}>
                    Все предметы
                    <Icon data={ChevronRight} />
                  </Button>
                </div>
              )}
              {listedSubjects.length ? cards : <p>Предметов пока нет.</p>}
            </section>
          )}
          {(overview || selected) && (
            <section className={overview ? "overviewWorks" : undefined}>
              <div className="sectionTitle">
                <h2>Практические работы</h2>
                <div className="assignmentControls">{!teacher && filters}
                  {teacher && selected && <Button view="action" onClick={() => setCreatingWork(true)}>
                    <Button.Icon><Icon data={Plus}/></Button.Icon>Создать практическую работу
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
