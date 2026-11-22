import React, {useState} from "react";
import {Button, Checkbox, Icon, Select, TextInput} from "@gravity-ui/uikit";
import {Plus} from "@gravity-ui/icons";
import {FormRow} from "@gravity-ui/components";
import {WorkspacePage} from "./WorkspacePage";
import {ActivityFields, Input, newActivity} from "./AssignmentActivities";

function localMinute(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16);
}

export function contentError(items) {
  for (const [index, item] of items.entries()) {
    const prefix = `Задание ${index + 1}. `;
    if (!item.title.trim()) return prefix + "Укажите название.";
    if (item.kind === "quiz") {
      for (const [j, q] of item.questions.entries()) {
        if (!q.prompt.trim() || q.answers.some(a => !a.text.trim()) || !q.answers.some(a => a.correct)) {
          return prefix + `В вопросе ${j + 1} заполните условие и варианты, отметьте хотя бы один правильный ответ.`;
        }
      }
    } else {
      if (!item.prompt.trim()) return prefix + "Заполните условие задачи.";
      if (item.mode === "unit" && item.cases.some(c => !c.code.trim())) return prefix + "Заполните код каждого unit-теста.";
    }
  }
  return "";
}

export function AssignmentForm({subject, subjects, initialSubjectId, bankTasks, onClose, onSave}) {
  const [subjectId,setSubjectId] = useState(subject?.id || initialSubjectId || subjects[0]?.id);
  const availableTasks = bankTasks.filter(task => task.subject === subjectId);
  const [title,setTitle] = useState("");
  const [opens,setOpens] = useState(() => localMinute(new Date()));
  const [due,setDue] = useState("");
  const [sequential,setSequential] = useState(false);
  const [review,setReview] = useState(false);
  const [items,setItems] = useState([]);
  const [saveError,setSaveError] = useState("");
  const [submitted,setSubmitted] = useState(false);
  const error = !title.trim() ? "Введите название работы." : !opens || !due || new Date(due) <= new Date(opens)
    ? "Дедлайн должен быть позже открытия доступа." : contentError(items);
  function move(index, offset) {
    const next = [...items];
    [next[index],next[index+offset]] = [next[index+offset],next[index]];
    setItems(next);
  }
  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    setSaveError("");
    if (error) return;
    try {
      onSave({id:crypto.randomUUID(), subject:subjectId, title:title.trim(), opensAt:new Date(opens).toISOString(),
      dueAt:new Date(due).toISOString(), sequential, review, activities:items});
    } catch (failure) {
      if (!(failure instanceof DOMException)) throw failure;
      setSaveError("Браузер не смог сохранить работу. Проверьте свободное место и разрешение на хранение данных.");
    }
  }
  return <WorkspacePage title="Новая практическая работа" actions={<>
    {submitted && (error || saveError) && <span role="alert">{error || saveError}</span>}
    <Button size="xl" onClick={onClose}>Отмена</Button>
    <Button size="xl" view="action" type="submit" extraProps={{form:"assignment-form"}}>Создать</Button>
  </>}>
    <form id="assignment-form" className="subjectForm" onSubmit={submit}>
      {subject ? <span>{subject.title}</span> : <fieldset><legend>Предмет</legend>
        <Select aria-label="Предмет работы" filterable value={[subjectId]} disabled={items.some(item => item.taskId)}
          options={subjects.map(s => ({value:s.id, content:s.title}))} onUpdate={([id]) => setSubjectId(id)}/>
        {items.some(item => item.taskId) && <span>Чтобы сменить предмет, отсоедините задачи из его банка.</span>}
      </fieldset>}
      <FormRow className="subjectTitleRow" direction="column" label="Название работы" fieldId="assignment-title" required>
        <TextInput id="assignment-title" size="l" autoFocus controlProps={{required:true}} value={title} onUpdate={setTitle} placeholder="Например, поиск в отсортированном массиве"/>
      </FormRow>
      <fieldset className="semesterFields assignmentPair"><legend>Сроки</legend>
        <Input label="Открытие доступа" type="datetime-local" value={opens} onUpdate={setOpens}/>
        <Input label="Дедлайн начала попыток" type="datetime-local" value={due} onUpdate={setDue}/>
      </fieldset>
      <fieldset className="assignmentBlock"><legend>Прохождение</legend>
        <Checkbox checked={sequential} onUpdate={setSequential}>Открывать следующее задание после успешной проверки предыдущего</Checkbox>
        <Checkbox checked={review} onUpdate={setReview}>Для зачёта требуется подтверждение преподавателя</Checkbox>
      </fieldset>
      <h2>Задания</h2>
      {items.map((item,index) => <fieldset className="assignmentBlock" key={item.id}>
        <legend>{index + 1}. {item.kind === "quiz" ? "Тест" : "Задача на программирование"}</legend>
        <div className="assignmentControls">
          <Button disabled={!index} onClick={() => move(index,-1)}>Выше</Button>
          <Button disabled={index === items.length-1} onClick={() => move(index,1)}>Ниже</Button>
          <Button onClick={() => setItems(items.filter(i => i.id !== item.id))}>Удалить задание</Button>
        </div>
        {item.taskId ? <strong>{item.title}</strong> : <ActivityFields item={item} update={patch => setItems(previous => previous.map(i => i.id === item.id ? {...i,...patch} : i))}/>}
      </fieldset>)}
      <Select aria-label="Прикрепить задачу из банка" placeholder="Прикрепить задачу из банка" filterable value={[]}
        options={availableTasks.map(task => ({value:task.id, content:task.title, disabled:items.some(item => item.taskId === task.id)}))}
        onUpdate={([id]) => {
          const task = availableTasks.find(entry => entry.id === id);
          if (task) setItems([...items, {...task, taskId:id, id:crypto.randomUUID()}]);
        }}/>
      <div className="assignmentControls">{[["quiz","Добавить тест"],["program","Добавить задачу"]].map(([kind,label]) =>
        <Button key={kind} size="l" onClick={() => setItems([...items,newActivity(kind)])}><Button.Icon><Icon data={Plus}/></Button.Icon>{label}</Button>)}</div>
    </form>
  </WorkspacePage>;
}
