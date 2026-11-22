import React from "react";
import {Card, Text} from "@gravity-ui/uikit";
import {WorkspacePage} from "./WorkspacePage";
import MarkdownContent from "./MarkdownContent";

const date = value => new Date(value).toLocaleString("ru-RU", {dateStyle:"long", timeStyle:"short"});

export function AssignmentDetails({work, subject, teacher, onBack}) {
  return <WorkspacePage title={work.title} onBack={onBack}>
    <div className="subjectInfo">
      <Text color="secondary">{subject.title}</Text>
      <div>Открытие доступа — {date(work.opensAt)}<br/>Сдать до {date(work.dueAt)}</div>
      {work.sequential && <div>Задания открываются по порядку после успешной проверки.</div>}
      {work.review && <div>Для зачёта требуется подтверждение преподавателя.</div>}
      {!work.activities.length && <p>В этой работе пока нет заданий.</p>}
      {work.activities.map((item,index) => <Card key={item.id}>
        <Text color="secondary">{item.kind === "quiz" ? "Тест" : "Задача на программирование"}</Text>
        <h2>{index + 1}. {item.title}</h2>
        {!teacher && work.sequential && index > 0 ? <p>Доступ после выполнения предыдущего задания.</p> :
          item.kind === "quiz" ? <>
            <p>Попыток — {item.attempts}. Для зачёта — {item.threshold} из {item.questions.length}.</p>
            {item.questions.map((q,i) => <section key={q.id}><h3>Вопрос {i+1}</h3>
              <MarkdownContent source={q.prompt}/>
              <ul>{q.answers.map(a => <li key={a.id}>{a.text}{teacher && a.correct && " ✓"}</li>)}</ul>
            </section>)}
          </> : <><MarkdownContent source={item.prompt}/>
            {item.minutes && <p>Время на решение — {item.minutes} мин.</p>}
            {teacher && <p>Проверка — {item.mode === "stdout" ? "STDOUT" : "unit-тесты"}. Проверочных тестов — {item.cases.length}.</p>}
          </>}
      </Card>)}
    </div>
  </WorkspacePage>;
}
