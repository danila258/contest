import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Card,
  Label,
  Menu,
  Table,
  Text,
  Icon,
  Select,
  ThemeProvider,
  Toaster,
  ToasterProvider,
  ToasterComponent,
} from "@gravity-ui/uikit";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
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
import { SubjectGroups } from "./SubjectGroups";
import { AssignmentForm } from "./AssignmentForm";
import { AssignmentDetails } from "./AssignmentDetails";
import { WorkspacePage } from "./WorkspacePage";
import { SubjectSettings, demoGroup, demoTeacher } from "./SubjectSettings";

import { WorkspaceNavigation } from "./WorkspaceNavigation";

import MarkdownContent from "./MarkdownContent";

const CodeEditor = React.lazy(() => import("./CodeEditor"));

const dateLabel = (day) =>
  deadline(day).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
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
  const [savedWorks, saveWorks] = useLocal("practice.works", []);
  const [creatingWork, setCreatingWork] = useState(false);
  const works = [...demoWorks, ...savedWorks];
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
  const deadlineOf = (w) => w.dueAt ? Date.parse(w.dueAt) : deadline(w.day).setHours(23,59,59,999);
  const workDate = (w) => w.dueAt ? new Date(w.dueAt).toLocaleString("ru-RU", {dateStyle:"short", timeStyle:"short"}) : dateLabel(w.day) + " · До 23:59";
  const state = (w) => w.activities
    ? (Date.parse(w.opensAt) > now ? "Запланирована" : deadlineOf(w) <= now ? "Срок истёк" : "Доступна")
    : attempts[w.id]?.at(-1)?.status || w.state;
  const visibleWorks = works.filter((w) => subject(w.subject) && (teacher || !w.opensAt || Date.parse(w.opensAt) <= now));
  const upcoming = visibleWorks.filter(
    (w) => deadlineOf(w) > now && state(w) !== "Зачтено",
  ).sort((a,b) => deadlineOf(a) - deadlineOf(b));
  const displayWorks = visibleWorks.filter(
    (w) =>
      (!selected || w.subject === selected.id) &&
      (filter === "Все статусы" || filter === state(w)),
  );
  function go(next, s = null) {
    pageSet(next);
    select(s);
    filterSet("Все статусы");
  }
  function submit() {
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
        { answer, status, time: new Date().toISOString() },
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
  if (creatingWork && selected && teacher) {
    return <AssignmentForm subject={selected} onClose={() => setCreatingWork(false)} onSave={work => {
      saveWorks([...savedWorks, work]);
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
            {subject(active.subject).title} · До {dateLabel(active.day)}, 23:59
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
              {active.day >= 0 && (
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
    <Card className="workList">
      <Table
        aria-label="Практические работы"
        width="max"
        verticalAlign="middle"
        wordWrap
        data={displayWorks}
        getRowDescriptor={(w) => ({ id: w.id })}
        onRowClick={open}
        emptyMessage="Работ пока нет."
        columns={[
          {
            id: "title",
            name: "Работа",
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
          {id: "deadline", name: "Начать до", template: workDate},
          {
            id: "status",
            name: "Статус",
            template: (w) => (
              <Label theme={statusThemes[state(w)] ?? "normal"}>
                {state(w)}
              </Label>
            ),
          },
        ]}
      />
    </Card>
  );
  const filters = (
    <Select
      aria-label="Статус работы"
      value={[filter]}
      options={opts([
        "Все статусы",
        ...(teacher ? ["Запланирована"] : []),
        "Срок истёк",
        "В работе",
        "Доступна",
        "Зачтено",
        "Отправлено",
        "На доработке",
      ])}
      onUpdate={(v) => filterSet(v[0])}
    />
  );
  return (
    <WorkspaceNavigation page={page} go={go} teacher={teacher}>
      <main className="workspace">
        <header className="workspaceHeader">
          {selected && (
            <Button view="flat" onClick={() => go("Предметы")}>
              {ico(ArrowLeft)} Все предметы
            </Button>
          )}
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
        <article>
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
            {teacher && page !== "Практические работы" && (
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
          {!selected && page !== "Практические работы" && (
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
          {(page === "Обзор" || page === "Практические работы" || selected) && (
            <div className={page === "Обзор" ? "columns" : ""}>
              <section>
                <div className="sectionTitle">
                  <h2>Практические работы</h2>
                  <div className="assignmentControls">{filters}
                    {teacher && selected && <Button view="action" onClick={() => setCreatingWork(true)}>
                      <Button.Icon><Icon data={Plus}/></Button.Icon>Создать практическую работу
                    </Button>}
                  </div>
                </div>
                {table}
              </section>
              {page === "Обзор" && (
                <Card className="deadlines">
                  <div className="sectionTitle">
                    <h2>Ближайшие сроки</h2>
                    {ico(Calendar)}
                  </div>
                  <Menu aria-label="Предстоящие работы">
                    {upcoming.map((w) => (
                      <Menu.Item
                        key={w.id}
                        onClick={() => open(w)}
                        iconStart={ico(Clock, 16)}
                      >
                        <div className="deadlineItem">
                          <Text variant="body-2">{w.title}</Text>
                          <Text variant="caption-2" color="secondary">
                            {workDate(w)}
                          </Text>
                        </div>
                      </Menu.Item>
                    ))}
                  </Menu>
                  {!upcoming.length && <p>Ближайших сроков нет.</p>}
                </Card>
              )}
            </div>
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
        </article>
      </main>
    </WorkspaceNavigation>
  );
}
createRoot(document.querySelector("#root")).render(
  <ThemeProvider theme="light">
    <ToasterProvider toaster={new Toaster()}>
      <App />
      <ToasterComponent />
    </ToasterProvider>
  </ThemeProvider>,
);
