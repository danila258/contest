import React, {useState} from "react";
import {Button, Card, Dialog, Text} from "@gravity-ui/uikit";
import {editInProgress} from "./workAccess";
import {WorkspacePage} from "./WorkspacePage";

import {Facts, WorkDescription, WorkSubject, WorkSummary} from "./WorkSummary";

function ActivityConditions({item}) {
  if (item.kind === "quiz") {
    return <>
      <Facts rows={[
        ["Вопросов",item.questions.length], ["Попыток",item.attempts],
        ["Для зачёта",`${item.threshold} из ${item.questions.length}`],
        ["Время",item.timer === "question" ? "На каждый вопрос" : `${item.minutes} мин на тест`],
        ["Возврат к предыдущим вопросам",item.back ? "Разрешён" : "Отключён"],
      ]}/>
      {item.timer === "question" && <ol aria-label="Время на каждый вопрос" className="questionTimes">
        {item.questions.map((q,index) => <li key={q.id}>Вопрос {index+1} — {q.minutes} мин</li>)}
      </ol>}
    </>;
  }
  return <Facts rows={[
    ["Время на решение",item.minutes ? `${item.minutes} мин` : "Без ограничения"],
    ["Лимит попыток","Без ограничения"],
  ]}/>;
}

export function WorkStart({work, subject, now, busy, returnAction, onStart}) {
  const [confirming,setConfirming] = useState(false);
  const [error,setError] = useState("");
  const expired = now >= Date.parse(work.dueAt);
  const empty = work.activities?.length === 0;
  React.useEffect(() => { setConfirming(false); setError(""); }, [work, busy]);
  async function confirm() {
    setConfirming(false);
    try { await onStart(); }
    catch (failure) { setError(failure instanceof DOMException ? "Браузер не смог сохранить начало работы. Попробуйте ещё раз." : failure.message); }
  }
  return <WorkspacePage title={work.title} returnAction={returnAction} actions={
    <Button view="action" size="xl" disabled={busy || expired || empty || now < Date.parse(work.opensAt)} onClick={() => setConfirming(true)}>Начать работу</Button>
  }>
    <div className="subjectInfo workConditions">
      <WorkSubject subject={subject}/>
      <h2>Условия прохождения</h2>
      <WorkSummary opensAt={work.opensAt} dueAt={work.dueAt} conditions={work.activities?.length ? [
        work.sequential ? "Задания открываются по порядку после успешной проверки." : "Задания можно выполнять в любом порядке.",
        work.review ? "Для зачёта требуется подтверждение преподавателя." : "Для зачёта нужно успешно выполнить все задания.",
      ] : []}/>
      <WorkDescription description={work.description}/>
      {work.activities ? work.activities.map((item,index) => <Card key={item.id}>
        <header className="activitySummaryHeading">
          <Text color="secondary">{index+1}. {item.kind === "quiz" ? "Тест" : "Задача на программирование"}</Text>
          <h3>{item.title}</h3>
        </header>
        <ActivityConditions item={item}/>
      </Card>) : <Card>
        <header className="activitySummaryHeading"><h3>{work.question ? "Тест" : "Задача на программирование"}</h3></header>
        <Facts rows={[["Время на решение","Без ограничения"],["Лимит попыток","Без ограничения"]]}/>
      </Card>}
      {empty && <p>В работе пока нет заданий.</p>}
      {busy && <p role="status">{editInProgress}</p>}
      {expired && <p role="status">Срок сдачи истёк.</p>}
      {error && <p role="alert">{error}</p>}
    </div>
    <Dialog open={confirming} onClose={() => setConfirming(false)} aria-label="Начать практическую работу?"
      maxWidth="s" fullWidth hasCloseButton={false} initialFocus="cancel">
      <Dialog.Header caption="Начать практическую работу?"/>
      <Dialog.Footer textButtonCancel="Отмена" textButtonApply="Начать"
        onClickButtonCancel={() => setConfirming(false)} onClickButtonApply={confirm}/>
    </Dialog>
  </WorkspacePage>;
}
