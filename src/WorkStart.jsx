import React, {useState} from "react";
import {Button, Card, Dialog, Text} from "@gravity-ui/uikit";
import {editInProgress} from "./workAccess";
import {WorkspacePage} from "./WorkspacePage";

function ActivityConditions({item}) {
  if (item.kind === "quiz") {
    return <>
      <p>Количество попыток — {item.attempts}. Для зачёта нужно правильных ответов: {item.threshold} из {item.questions.length}.</p>
      {item.timer === "question"
        ? <div>Время на каждый вопрос:<ol>{item.questions.map(q => <li key={q.id}>{q.minutes} мин.</li>)}</ol></div>
        : <p>Время на тест — {item.minutes} мин.</p>}
      <p>{item.back ? "Можно возвращаться к предыдущим вопросам." : "Вопросы проходятся по порядку, без возврата."}
        {" "}{item.shuffle ? "Варианты ответа перемешиваются." : "Порядок вариантов ответа фиксирован."}</p>
    </>;
  }
  return <>
    <p>{item.minutes ? `Время на решение — ${item.minutes} мин.` : "Отдельного ограничения времени на решение нет."}</p>
    <p>Лимит попыток не задан.</p>
  </>;
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
      <Text color="secondary">{subject.title}</Text>
      <h2>Условия прохождения</h2>
      <p>Сдать до {new Date(work.dueAt).toLocaleString("ru-RU",{dateStyle:"long",timeStyle:"short"})}.</p>
      {work.activities ? <>
        {!!work.activities.length && <p>{work.sequential ? "Следующее задание откроется после успешной проверки предыдущего." : "Задания можно выполнять в любом порядке."}
          {" "}{work.review ? "Для зачёта требуется подтверждение преподавателя." : "Для зачёта нужно успешно выполнить все задания."}</p>}
        {work.activities.map((item,index) => <Card key={item.id}>
          <h3>{index+1}. {item.title}</h3>
          <ActivityConditions item={item}/>
        </Card>)}
        {empty && <p>В работе пока нет заданий.</p>}
      </> : <p>В работе одно задание: {work.question ? "тест" : "задача по программированию"}. Отдельный таймер и лимит попыток не заданы.</p>}
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
