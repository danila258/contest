import React from "react";
import {Card, Disclosure, Label, Text} from "@gravity-ui/uikit";
import {programModes} from "./activityData";
import MarkdownContent from "./MarkdownContent";

import {Facts} from "./WorkSummary";

function CodeBlock({label, value}) {
  return <div className="previewCode"><Text variant="subheader-1">{label}</Text>
    <pre><code>{value || "Пусто"}</code></pre>
  </div>;
}

const checkNames = {format:"Форматирование", static:"Статический анализ", dynamic:"Динамический анализ"};
const checkModes = {off:"Отключено", warn:"Замечание", block:"Блокирует зачёт"};

export default function TeacherActivityPreview({item}) {
  if (item.kind === "quiz") return <div className="teacherPreview">
    <Facts rows={[
      ["Вопросов",item.questions.length], ["Попыток",item.attempts],
      ["Для зачёта",item.threshold && `${item.threshold} из ${item.questions.length}`],
      ["Время",item.timer && (item.timer === "question" ? "На каждый вопрос" : `${item.minutes} мин на тест`)],
      ["Порядок ответов",item.shuffle == null ? null : item.shuffle ? "Случайный" : "Фиксированный"],
      ["Возврат к предыдущим вопросам",item.back == null ? null : item.back ? "Разрешён" : "Отключён"],
    ]}/>
    {item.questions.map((q,index) => <Card key={q.id} className="previewQuestion">
      <div className="previewQuestionTitle"><Text as="h3" variant="subheader-2">Вопрос {index+1}</Text>
        {item.timer === "question" && <Text color="secondary">{q.minutes} мин</Text>}
      </div>
      <MarkdownContent source={q.prompt}/>
      <ul className="previewAnswers">{q.answers.map(a => <li key={a.id}><span>{a.text}</span>
        {a.correct && <Label theme="success" size="s">Верный ответ</Label>}
      </li>)}</ul>
    </Card>)}
  </div>;

  const cases = item.cases ?? [];
  const sources = Object.entries(item.sources ?? {}).filter(([name]) => item.mode === "unit" || name === "main.cpp");
  return <div className="teacherPreview">
    <fieldset className="previewGroup"><legend>Условие задачи</legend>
      <MarkdownContent source={item.prompt}/>
    </fieldset>
    <Facts rows={[
      ["Время на решение",item.minutes ? `${item.minutes} мин` : "Без ограничения"],
      ["Способ проверки",programModes[item.mode]],
      ["Логи тестов для студента",item.mode === "none" || item.logs == null ? null : item.logs ? "Доступны" : "Скрыты"],
    ]}/>
    {item.checks && <fieldset className="previewGroup"><legend>Проверки кода</legend>
      <Facts rows={Object.entries(checkNames).map(([key,name]) => [name,checkModes[item.checks[key]]])}/>
    </fieldset>}
    {sources.length > 0 && <Disclosure summary="Начальный код" keepMounted={false}>
      {sources.map(([name,code]) => <CodeBlock key={name} label={name} value={code}/>)}
    </Disclosure>}
    {cases.length > 0 && <Disclosure summary={`Тесты · ${cases.length}`} keepMounted={false}>
      {cases.map((c,i) => <fieldset className="previewGroup previewCase" key={c.id ?? i}>
        <legend>Тест {i+1}</legend>
        {item.mode === "unit" ? <CodeBlock label="Код проверки" value={c.code}/> :
          <><CodeBlock label="Входные данные" value={c.input}/><CodeBlock label="Ожидаемый вывод" value={c.output}/></>}
      </fieldset>)}
    </Disclosure>}
    {item.reference && <Disclosure summary="Эталонное решение" keepMounted={false}><pre><code>{item.reference}</code></pre></Disclosure>}
  </div>;
}
