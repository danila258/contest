import React, {lazy, Suspense, useId, useState} from "react";
import {Button, Checkbox, Select, TextArea, TextInput} from "@gravity-ui/uikit";
import {FormRow} from "@gravity-ui/components";
import {starter} from "./data";

const MarkdownField = lazy(() => import("./MarkdownField"));
const CodeEditor = lazy(() => import("./CodeEditor"));
const id = () => crypto.randomUUID();
const answer = () => ({id: id(), text: "", correct: false});
const question = () => ({id: id(), prompt: "", minutes: "5", answers: [answer(), answer()]});
const testCase = () => ({id: id(), input: "", output: "", code: ""});
export const files = ["main.cpp", "task_name.cpp", "task_name.h"];
const checks = {format: "Форматирование", static: "Статический анализ", dynamic: "Динамический анализ"};

export function newActivity(kind) {
  const common = {id: id(), kind, title: ""};
  if (kind === "quiz") return {...common, attempts: "1", threshold: "1", back: true, shuffle: false,
    timer: "whole", minutes: "30", questions: [question()]};
  return {...common, prompt: "", mode: "stdout", sources: {"main.cpp": starter}, cases: [testCase()],
    reference: "", minutes: "", logs: false, checks: {format: "off", static: "off", dynamic: "off"}};
}

export function Input({label, value, onUpdate, required = true, type = "text", placeholder, ...limits}) {
  const fieldId = useId();
  return <FormRow direction="column" label={label} fieldId={fieldId} required={required}>
    <TextInput id={fieldId} size="l" type={type} value={value} onUpdate={onUpdate}
      controlProps={{required, ...limits}} placeholder={placeholder}/>
  </FormRow>;
}
function Choice({label, value, options, onUpdate}) {
  const fieldId = useId();
  return <FormRow direction="column" label={label} fieldId={fieldId}>
    <Select id={fieldId} aria-label={label} size="l" value={[value]}
      options={options.map(([value, content]) => ({value, content}))} onUpdate={v => onUpdate(v[0])}/>
  </FormRow>;
}
function Toggle({label, checked, onUpdate}) {
  return <Checkbox checked={checked} onUpdate={onUpdate}>{label}</Checkbox>;
}

function replace(items, itemId, patch) {
  return items.map(item => item.id === itemId ? {...item, ...patch} : item);
}

function Quiz({item, update}) {
  function change(q, patch) { update({questions: replace(item.questions, q.id, patch)}); }
  return <>
    <div className="assignmentPair">
      <Input label="Количество попыток" type="number" min="1" value={item.attempts} onUpdate={attempts => update({attempts})}/>
      <Input label="Правильных ответов для зачёта" type="number" min="1" max={item.questions.length} value={item.threshold} onUpdate={threshold => update({threshold})}/>
    </div>
    <Toggle label="Перемешивать варианты ответа" checked={item.shuffle} onUpdate={shuffle => update({shuffle})}/>
    <Toggle label="Разрешить возврат к вопросам" checked={item.back} onUpdate={back => update({back, timer: back ? "whole" : item.timer})}/>
    {!item.back && <Choice label="Таймер" value={item.timer} options={[[ "whole","На весь тест"],["question","На каждый вопрос"]]} onUpdate={timer => update({timer})}/>}
    {item.timer === "whole" && <Input label="Время на тест, мин" type="number" min="1" value={item.minutes} onUpdate={minutes => update({minutes})}/>}
    {item.questions.map((q, i) => <fieldset className="assignmentBlock" key={q.id}><legend>Вопрос {i + 1}</legend>
      <MarkdownField label="Условие вопроса" placeholder="Какой результат вернёт эта функция?" value={q.prompt} onChange={prompt => change(q, {prompt})}/>
      {item.timer === "question" && <Input label="Время на вопрос, мин" type="number" min="1" value={q.minutes} onUpdate={minutes => change(q,{minutes})}/>}
      {q.answers.map((a, j) => <div className="assignmentControls" key={a.id}>
        <Input label={`Вариант ${j + 1}`} value={a.text} onUpdate={text => change(q,{answers: replace(q.answers,a.id,{text})})}/>
        <Toggle label="Правильный" checked={a.correct} onUpdate={correct => change(q,{answers: replace(q.answers,a.id,{correct})})}/>
        <Button disabled={q.answers.length === 1} onClick={() => change(q,{answers:q.answers.filter(v => v.id !== a.id)})}>Удалить вариант</Button>
      </div>)}
      <div className="assignmentControls"><Button onClick={() => change(q,{answers:[...q.answers,answer()]})}>Добавить вариант</Button>
      <Button disabled={item.questions.length === 1} onClick={() => update({questions:item.questions.filter(v => v.id !== q.id)})}>Удалить вопрос</Button></div>
    </fieldset>)}
    <Button onClick={() => update({questions:[...item.questions,question()]})}>Добавить вопрос</Button>
  </>;
}

function Program({item, update}) {
  const [file, setFile] = useState(files[0]);
  return <>
    <MarkdownField label="Условие задачи" placeholder="Опишите задачу, формат входных данных и ожидаемый результат" value={item.prompt} onChange={prompt => update({prompt})}/>
    <Choice label="Способ проверки" value={item.mode} options={[["stdout","Сравнение STDOUT"],["unit","Unit-тесты"]]} onUpdate={mode => {setFile(files[0]); update({mode});}}/>
    <fieldset className="assignmentBlock"><legend>Начальный код</legend>
      {item.mode === "unit" ? <Choice label="Файл" value={file} options={files.map(f => [f,f])} onUpdate={setFile}/> : <span>main.cpp</span>}
      <CodeEditor key={file} filename={file} initialValue={item.sources[file] ?? ""} onChange={code => update({sources:{...item.sources,[file]:code}})}/>
    </fieldset>
    {item.cases.map((c,i) => <fieldset className="assignmentBlock" key={c.id}><legend>Проверочный тест {i+1}</legend>
      {item.mode === "unit" ? <CodeEditor filename="Проверочный тест" initialValue={c.code} onChange={code => update({cases:replace(item.cases,c.id,{code})})}/> :
        ["input","output"].map(key => <label key={key}>{key === "input" ? "Входные данные" : "Ожидаемый вывод"}
          <TextArea value={c[key]} onUpdate={value => update({cases:replace(item.cases,c.id,{[key]:value})})}/></label>)}
      <Button disabled={item.cases.length === 1} onClick={() => update({cases:item.cases.filter(v => v.id !== c.id)})}>Удалить проверочный тест</Button>
    </fieldset>)}
    <Button onClick={() => update({cases:[...item.cases,testCase()]})}>Добавить проверочный тест</Button>
    <label>Эталонное решение (C++) <input type="file" accept=".cpp,.cc,.cxx" onChange={async e => {
      const file = e.target.files[0];
      if (file) update({reference:await file.text()});
    }}/></label>
    <Input label="Лимит времени на решение, мин" type="number" required={false} min="1" placeholder="Без ограничения" value={item.minutes} onUpdate={minutes => update({minutes})}/>
    {Object.entries(checks).map(([key,label]) => <Choice key={key} label={label} value={item.checks[key]}
      options={[["off","Отключено"],["warn","Замечание"],["block","Блокирует зачёт"]]}
      onUpdate={value => update({checks:{...item.checks,[key]:value}})}/>)}
    <Toggle label="Показывать студенту логи тестов" checked={item.logs} onUpdate={logs => update({logs})}/>
  </>;
}

export function ActivityFields({item, update}) {
  return <Suspense fallback={<p role="status">Загрузка редактора…</p>}>
    <Input label={item.kind === "quiz" ? "Название теста" : "Название задачи"} value={item.title} onUpdate={title => update({title})}/>
    {item.kind === "quiz" ? <Quiz item={item} update={update}/> : <Program item={item} update={update}/>}
  </Suspense>;
}
