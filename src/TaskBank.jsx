import {JsonImport} from "./JsonImport";
import {readBank} from "./importData";
import {SubjectFilter} from "./SubjectFilter";
import React, {lazy, Suspense, useState} from "react";
import {Button, Select, Table, TextInput} from "@gravity-ui/uikit";
import {ActivityFields, Input, newActivity} from "./AssignmentActivities";
import {contentError} from "./AssignmentForm";
import MarkdownContent from "./MarkdownContent";
import {WorkspacePage} from "./WorkspacePage";

const MarkdownField = lazy(() => import("./MarkdownField"));

function PromptPreview({source}) {
  const [open,setOpen] = useState(false);
  return <details className="bankPrompt" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Посмотреть условие</summary>
    {open && <MarkdownContent source={source}/>}
  </details>;
}

const options = items => items.map(({id,title}) => ({value:id, content:title}));

function BankEditor({initial, subjects, tasks, onClose, onSave}) {
  const [item,setItem] = useState(initial);
  const [error,setError] = useState("");
  const isTask = item.kind === "program";
  const update = patch => setItem(previous => ({...previous,...patch}));
  function submit(event) {
    event.preventDefault();
    const problem = isTask ? contentError([item]) : !item.prompt.trim() && "Введите теоретический вопрос.";
    if (problem || !item.title.trim()) return setError(problem || "Введите название.");
    try { onSave({...item,title:item.title.trim()}); }
    catch { setError("Не удалось сохранить изменения в этом браузере."); }
  }
  return <WorkspacePage title={isTask ? "Задача банка" : "Теоретический вопрос"} actions={<>
    {error && <span role="alert">{error}</span>}
    <Button size="xl" onClick={onClose}>Отмена</Button>
    <Button size="xl" view="action" type="submit" extraProps={{form:"bank-editor"}}>Сохранить</Button>
  </>}>
    <form className="subjectForm" id="bank-editor" onSubmit={submit}>
      <fieldset><legend>Предмет</legend>
        <Select aria-label="Предмет материала" disabled={initial.existing} filterable value={[item.subject]} options={options(subjects)}
          onUpdate={([subject]) => update({subject,taskIds:[]})}/>
      </fieldset>
      {isTask ? <ActivityFields item={item} update={update}/> : <>
        <Input label="Название вопроса" value={item.title} onUpdate={title => update({title})}/>
        <Suspense fallback={<p>Загрузка редактора…</p>}>
          <MarkdownField label="Теоретический вопрос" placeholder="Как выбор структуры данных влияет на сложность поиска?"
            value={item.prompt} onChange={prompt => update({prompt})}/>
        </Suspense>
        <fieldset><legend>Связанные задачи</legend>
          <Select aria-label="Связанные задачи" multiple filterable placeholder="Весь предмет" value={item.taskIds}
            options={options(tasks.filter(t => t.subject === item.subject))} onUpdate={taskIds => update({taskIds})}/>
        </fieldset>
      </>}
    </form>
  </WorkspacePage>;
}

export function TaskBank({subjects,tasks,bank,save,renderWorkspace}) {
  const [subject,setSubject] = useState("");
  const [query,setQuery] = useState("");
  const [section,setSection] = useState("tasks");
  const [editor,setEditor] = useState(null);
  const accessible = new Map(subjects.map(s => [s.id,s.title]));
  const taskNames = new Map(tasks.map(t => [t.id,t.title]));
  const isTasks = section === "tasks";
  const rows = (isTasks ? tasks : bank.questions).filter(row => accessible.has(row.subject) &&
    (!subject || row.subject === subject) && (row.title + " " + row.prompt).toLowerCase().includes(query.toLowerCase()));
  function edit(item) { setEditor(item); }
  if (editor) return <BankEditor initial={editor} subjects={subjects} tasks={tasks} onClose={() => setEditor(null)}
    onSave={({existing, ...record}) => {
      save(current => ({...current, [section]:[...current[section].filter(row => row.id !== record.id),record]}));
      setEditor(null);
    }}/>;
  return renderWorkspace(<article className="bankPage">
    <h1>Банк задач</h1>
    <div className="assignmentControls">
      <Select aria-label="Раздел банка" value={[section]} options={[{value:"tasks",content:"Задачи по программированию"},{value:"questions",content:"Теоретические вопросы"}]}
        onUpdate={([value]) => {setSection(value); setQuery("");}}/>
      <SubjectFilter subjects={subjects} value={subject} onChange={value => {setSubject(value);}}/>
      <Button view="action" disabled={!subjects.length} onClick={() => edit({...(
        isTasks ? newActivity("program") : {id:crypto.randomUUID(),kind:"theory",title:"",prompt:"",taskIds:[]}
      ),subject:subject || subjects[0].id})}>{isTasks ? "Создать задачу" : "Создать вопрос"}</Button>
    </div>
    <TextInput aria-label="Поиск по банку" placeholder="Найти по названию или условию" value={query} onUpdate={setQuery} hasClear/>
    <JsonImport template="tasks" onImport={data => {
      let count;
      save(current => {
        const added = readBank(data,subjects,subject,current);
        count = added.tasks.length + added.questions.length;
        return {...current, tasks:[...current.tasks,...added.tasks], questions:[...current.questions,...added.questions]};
      });
      return count;
    }}/>
    <Table width="max" wordWrap data={rows} emptyMessage="Материалов по этому запросу нет." columns={[
      {id:"title",name:isTasks ? "Задача" : "Вопрос",template:row => <Button view="flat" onClick={() => edit({...row,existing:true})}>{row.title}</Button>},
      {id:"prompt",name:"Условие",template:row => <PromptPreview source={row.prompt}/>},
      {id:"subject",name:"Предмет",template:row => accessible.get(row.subject)},
      ...(!isTasks ? [{id:"scope",name:"Связанные задачи",template:row => row.taskIds.length ? row.taskIds.map(id => taskNames.get(id)).join(", ") : "Весь предмет"}] : [])
    ]}/>
  </article>);
}
