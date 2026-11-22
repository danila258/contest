import React, {useId, useState} from "react";
import {Button, Checkbox, Icon, Select, TextInput} from "@gravity-ui/uikit";
import {Plus} from "@gravity-ui/icons";
import {DateField, DatePicker} from "@gravity-ui/date-components";
import {academicYearOf, currentSemester} from "./semester";
import {dateTime} from "@gravity-ui/date-utils";
import {FormRow} from "@gravity-ui/components";
import {readActivityDrafts} from "./importData";
import {JsonImport} from "./JsonImport";
import {WorkspacePage} from "./WorkspacePage";
import {ActivityFields, newActivity} from "./AssignmentActivities";

function scheduleRange(subject) {
  const year = academicYearOf(subject) ?? currentSemester().academicYear;
  const [start, end] = year.split("/");
  return {start:start + "-09-01", end:end + "-08-31"};
}

function openingDate(range) {
  const today = dateTime().format("YYYY-MM-DD");
  return today >= range.start && today <= range.end ? today : range.start;
}

function ScheduleField({timeId, label, value, onUpdate, range, placeholderDate}) {
  const id = useId();
  return <fieldset className="scheduleField">
    <legend>{label}</legend>
    <FormRow direction="column" label="Дата" fieldId={id} required>
      <DatePicker id={id} aria-label="Дата" format="DD.MM.YYYY" size="l"
        minValue={dateTime({input:range.start})} maxValue={dateTime({input:range.end}).endOf("day")}
        placeholderValue={dateTime({input:placeholderDate})}
        value={value.date ? dateTime({input:value.date}) : null}
        onUpdate={date => onUpdate({...value, date:date?.format("YYYY-MM-DD") ?? ""})}/>
    </FormRow>
    <FormRow direction="column" label="Время" fieldId={timeId} required>
      <DateField id={timeId} aria-label="Время" size="l" format="HH:mm"
        value={value.time ? dateTime({input:`2000-01-01T${value.time}:00Z`, timeZone:"UTC"}) : null}
        timeZone="UTC"
        onUpdate={time => onUpdate({...value, time:time?.format("HH:mm") ?? ""})}/>
    </FormRow>
  </fieldset>;
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

export function AssignmentForm({subject, subjects, initialSubjectId, bankTasks, onImport, onClose, onSave}) {
  const [importedId,setImportedId] = useState(null);
  const [subjectId,setSubjectId] = useState(subject?.id || initialSubjectId || subjects[0]?.id);
  const range = scheduleRange(subjects.find(s => s.id === subjectId));
  const availableTasks = bankTasks.filter(task => task.subject === subjectId);
  const [title,setTitle] = useState("");
  const [opens,setOpens] = useState(() => ({date:openingDate(range), time:"00:01"}));
  const [due,setDue] = useState({date:"", time:"23:59"});
  const [sequential,setSequential] = useState(false);
  const [review,setReview] = useState(false);
  const [items,setItems] = useState([]);
  const [saveError,setSaveError] = useState("");
  const [submitted,setSubmitted] = useState(false);
  const opensAt = new Date(`${opens.date}T${opens.time}`);
  const dueAt = new Date(`${due.date}T${due.time}`);
  function importDraft(data) {
    const draft = onImport(data, subjectId);
    function localSchedule(instant) {
      const local = dateTime({input:instant});
      return {date:local.format("YYYY-MM-DD"), time:local.format("HH:mm")};
    }
    setImportedId(draft.id);
    setSubjectId(draft.subject);
    setTitle(draft.title);
    setOpens(localSchedule(draft.opensAt));
    setDue(localSchedule(draft.dueAt));
    setSequential(draft.sequential);
    setReview(draft.review);
    setItems(draft.activities);
    setSaveError("");
    setSubmitted(false);
  }
  function changeSubject(id) {
    const nextRange = scheduleRange(subjects.find(s => s.id === id));
    const inRange = date => date >= nextRange.start && date <= nextRange.end;
    if (!inRange(opens.date)) setOpens({...opens, date:openingDate(nextRange)});
    if (!inRange(due.date)) setDue({...due, date:""});
    setSubjectId(id);
  }
  const invalidDate = [opens.date, due.date].some(date => !date || date < range.start || date > range.end);
  const error = !title.trim() ? "Введите название работы." : invalidDate
    ? "Выберите обе даты в пределах учебного года предмета." : !(dueAt > opensAt)
    ? "Срок сдачи должен быть позже открытия доступа." : contentError(items);
  function move(index, offset) {
    const next = [...items];
    [next[index],next[index+offset]] = [next[index+offset],next[index]];
    setItems(next);
  }
  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    setSaveError("");
    // DateField retains its last complete value while one segment is empty.
    for (const id of ["opens-time", "due-time"]) {
      const input = e.currentTarget.elements.namedItem(id);
      const text = input.value.replace(/\p{Cf}/gu, "");
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) {
        setSaveError("Заполните часы и минуты.");
        input.focus();
        return;
      }
    }
    if (error) return;
    try {
      onSave({id:importedId ?? crypto.randomUUID(), subject:subjectId, title:title.trim(), opensAt:opensAt.toISOString(),
      dueAt:dueAt.toISOString(), sequential, review, activities:items});
    } catch (failure) {
      setSaveError(failure instanceof DOMException
        ? "Браузер не смог сохранить работу. Проверьте свободное место и разрешение на хранение данных." : failure.message);
    }
  }
  return <WorkspacePage title="Новая практическая работа" actions={<>
    {submitted && (saveError || error) && <span role="alert">{saveError || error}</span>}
    <Button size="xl" onClick={onClose}>Отмена</Button>
    <Button size="xl" view="action" type="submit" extraProps={{form:"assignment-form"}}>Создать</Button>
  </>}>
    <form id="assignment-form" className="subjectForm" onSubmit={submit}>
      <JsonImport template="works" onImport={importDraft} successMessage="Форма заполнена из файла. Проверьте работу и нажмите «Создать»."/>
      {subject ? <span>{subject.title}</span> : <fieldset><legend>Предмет</legend>
        <Select aria-label="Предмет работы" filterable value={[subjectId]} disabled={items.some(item => item.taskId)}
          options={subjects.map(s => ({value:s.id, content:s.title}))} onUpdate={([id]) => changeSubject(id)}/>
        {items.some(item => item.taskId) && <span>Чтобы сменить предмет, отсоедините задачи из его банка.</span>}
      </fieldset>}
      <FormRow className="subjectTitleRow" direction="column" label="Название работы" fieldId="assignment-title" required>
        <TextInput id="assignment-title" size="l" autoFocus controlProps={{required:true}} value={title} onUpdate={setTitle} placeholder="Например, поиск в отсортированном массиве"/>
      </FormRow>
      <div>Учебный год {range.start.slice(0, 4)}/{range.end.slice(0, 4)}</div>
      <div className="assignmentPair">
        <ScheduleField timeId="opens-time" key={range.start + "-open"} range={range} placeholderDate={openingDate(range)} label="Открытие доступа" value={opens} onUpdate={setOpens}/>
        <ScheduleField timeId="due-time" key={range.start + "-due"} range={range} placeholderDate={opens.date || openingDate(range)} label="Сдать до" value={due} onUpdate={setDue}/>
      </div>
      <fieldset className="assignmentBlock"><legend>Прохождение</legend>
        <Checkbox checked={sequential} onUpdate={setSequential}>Открывать следующее задание после успешной проверки предыдущего</Checkbox>
        <Checkbox checked={review} onUpdate={setReview}>Для зачёта требуется подтверждение преподавателя</Checkbox>
      </fieldset>
      <h2>Задания</h2>
      <JsonImport template="activities" templateLabel="Шаблон заданий" importLabel="Добавить задания из JSON" onImport={data => {
        const added = readActivityDrafts(data,subjectId);
        setItems(previous => [...previous,...added]);
        return added.length;
      }}/>
      {items.map((item,index) => <fieldset className="assignmentBlock" key={item.id}>
        <legend>{index + 1}. {item.kind === "quiz" ? "Тест" : "Задача на программирование"}</legend>
        <div className="assignmentControls">
          <Button disabled={!index} onClick={() => move(index,-1)}>Выше</Button>
          <Button disabled={index === items.length-1} onClick={() => move(index,1)}>Ниже</Button>
          <Button onClick={() => setItems(items.filter(i => i.id !== item.id))}>
            {item.kind === "quiz" ? "Удалить тест" : "Удалить задание"}
          </Button>
        </div>
        {!item.taskId && <JsonImport template={item.kind} templateLabel={item.kind === "quiz" ? "Шаблон теста" : "Шаблон задачи"}
          importLabel={item.kind === "quiz" ? "Заполнить тест из JSON" : "Заполнить задачу из JSON"}
          onImport={data => {
            const [replacement] = readActivityDrafts(data,subjectId,item.kind);
            setItems(previous => previous.map(entry => entry.id === item.id ? replacement : entry));
            return 1;
          }}/>}
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
