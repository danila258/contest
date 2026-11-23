import React, {lazy, Suspense, useEffect, useState} from "react";
import {Button, Card, Checkbox, RadioGroup, Select, Text} from "@gravity-ui/uikit";
import MarkdownContent from "./MarkdownContent";
import {attemptDeadline, beginAttempt, expireAttempt, finishAttempt, sourceFiles} from "./studentAttempt";

const CodeEditor = lazy(() => import("./CodeEditor"));

export default function StudentActivity({item, state, due, update, heading, children}) {
  const [file,setFile] = useState("main.cpp");
  const [error,setError] = useState("");
  const [now,setNow] = useState(Date.now);
  const [showTimer,setShowTimer] = useState(true);
  const isQuiz = item.kind === "quiz";
  const draft = state?.draft;
  const history = state?.history ?? [];
  const latest = history.at(-1);
  function change(transform) {
    try {
      update(previous => {
        const now = Date.now();
        const current = expireAttempt(item,previous,due,now);
        return current !== previous || now >= due ? current : transform(current,now);
      });
      setError("");
    } catch { setError("Не удалось сохранить изменения в браузере."); }
  }
  const deadline = draft ? attemptDeadline(item,draft,due) : null;
  const hasTimer = Boolean(draft && (item.minutes || (isQuiz && item.timer === "question")));
  useEffect(() => {
    if (!state) change((current,time) => current.draft || current.history.length ? current : {...current,draft:beginAttempt(item,time)});
  }, [item.id,state == null,due]);
  useEffect(() => {
    if (deadline == null) return;
    function tick() {
      const time = Date.now();
      if (time >= deadline) change(current => current);
      if (hasTimer && showTimer) setNow(time);
    }
    tick();
    const timer = setInterval(tick,1000);
    return () => clearInterval(timer);
  }, [item.id,deadline,hasTimer,showTimer]);

  function edit(transform) {
    change((current,now) => current.draft ? {...current,draft:transform(current.draft,now)} : current);
  }
  const question = isQuiz && draft ? item.questions[draft.index] : null;
  const selected = question ? draft.answers[question.id] ?? [] : [];
  const choices = question ? draft.order[draft.index].map(id => question.answers.find(a => a.id === id)) : [];
  const multiple = question?.answers.filter(a => a.correct).length > 1;
  function answer(values) {
    edit(d => d.index === draft.index ? {...d,answers:{...d.answers,[question.id]:values}} : d);
  }
  const canRetry = !isQuiz || history.length < Number(item.attempts);
  const timer = hasTimer && <div className={isQuiz ? "quizTimer" : "assignmentControls"}>
      {showTimer && <Text color="secondary">Осталось {Math.floor(Math.max(0,deadline-now)/60000)} мин {Math.floor(Math.max(0,deadline-now)/1000)%60} с</Text>}
      <Button view="flat" size="s" onClick={() => setShowTimer(!showTimer)}>{showTimer ? "Скрыть таймер" : "Показать таймер"}</Button>
    </div>;
  return <>
    {question && <aside className="quizProgress" aria-label="Прохождение теста">
      <Card className="quizProgressCard">
        {timer}
        <Text variant="subheader-2">Вопрос {draft.index+1} из {item.questions.length}</Text>
        <div className="questionNumbers">
          {item.questions.map((entry,index) =>
            <Button key={entry.id} size="s" selected={index === draft.index}
              aria-label={`Вопрос ${index+1}`} aria-current={index === draft.index ? "step" : undefined}
              disabled={index !== draft.index && !(item.back && draft.answers[entry.id]?.length)}
              onClick={() => edit(d => ({...d,index}))}>{index+1}</Button>)}
        </div>
      </Card>
    </aside>}
    <div className="studentActivityPanel">
    <div className="activityToolbar">{heading}</div>
    <Card className="studentActivity">
    {!isQuiz && timer}
    {!isQuiz && <MarkdownContent source={item.prompt}/>}
    {latest && <Text role="status">Последняя попытка — {latest.status}{isQuiz && ` (${latest.score} из ${item.questions.length})`}</Text>}
    {draft && (isQuiz ? <>
      <MarkdownContent source={question.prompt}/>
      {multiple ? <div className="quizChoices" role="group" aria-label="Ответы">{choices.map(a =>
        <Checkbox key={a.id} checked={selected.includes(a.id)} onUpdate={checked =>
          answer(checked ? [...selected,a.id] : selected.filter(id => id !== a.id))}>{a.text}</Checkbox>)}</div> :
        <RadioGroup aria-label="Ответ" direction="vertical" value={selected[0] ?? ""} options={choices.map(a => ({value:a.id,content:a.text}))}
          onUpdate={value => answer([value])}/>}

    </> : <>
      {item.mode === "unit" ? <Select aria-label="Файл решения" value={[file]} onUpdate={([name]) => setFile(name)}
        options={sourceFiles(item).map(name => ({value:name,content:name}))}/> : <Text>main.cpp</Text>}
      <Suspense fallback={<p role="status">Загрузка редактора…</p>}>
        <CodeEditor key={file} filename={file} initialValue={draft.sources[file]}
          onChange={code => edit(d => ({...d,sources:{...d.sources,[file]:code}}))}/>
      </Suspense>
      <Text color="secondary">Черновик сохраняется в этом браузере. Автоматическая проверка C++ пока недоступна.</Text>
      <Button view="action" onClick={() => change((s,now) => s.draft ? finishAttempt(item,s,now) : s)}>Сохранить демо-отправку</Button>
    </>)}
    {!draft && Date.now() >= due && <Text>Срок сдачи истёк.</Text>}
    {!draft && latest && canRetry && Date.now() < due && <Button onClick={() => change((s,now) =>
      s.draft || (isQuiz && s.history.length >= Number(item.attempts)) ? s : {...s,draft:beginAttempt(item,now)})}>Начать новую попытку</Button>}
    {error && <Text role="alert" color="danger">{error}</Text>}
    </Card>
    {isQuiz && draft ? (
      <nav className="activitySteps" aria-label="Вопросы теста">
        {item.back && draft.index > 0 && <Button onClick={() => edit(d => ({...d,index:d.index-1}))}>Предыдущий вопрос</Button>}
        {draft.index+1 < item.questions.length ?
          <Button view="action" disabled={!selected.length} onClick={() => edit((d,now) =>
            ({...d,index:d.index+1,questionStarted:now}))}>Следующий вопрос</Button> :
          <Button view="action" disabled={!selected.length} onClick={() => change((s,now) => s.draft ? finishAttempt(item,s,now) : s)}>Проверить ответы</Button>}
      </nav>
    ) : children}
    </div>
  </>;
}
