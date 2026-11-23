import {Code, ListUl} from "@gravity-ui/icons";
import {CatalogueTable} from "./CatalogueTable";
import {SubjectFilter} from "./SubjectFilter";
import {subjectSelectLabel} from "./semester";
import {WorkLabels} from "./WorkLabels";
import {savedActivity} from "./activityData";
import {JsonImport} from "./JsonImport";
import {readBank} from "./importData";
import React, {lazy, Suspense, useState} from "react";
import {Button, Select, TextInput} from "@gravity-ui/uikit";
import {ActivityFields, Input, newActivity} from "./AssignmentActivities";
import {contentError} from "./AssignmentForm";
import MarkdownContent from "./MarkdownContent";
import TeacherActivityPreview from "./TeacherActivityPreview";
import {WorkspacePage} from "./WorkspacePage";

const MarkdownField = lazy(() => import("./MarkdownField"));

function promptOf(item) {
  return item.kind === "quiz" ? item.questions.map(q => q.prompt).join("\n\n") : item.prompt;
}

function PromptPreview({source}) {
  const [open,setOpen] = useState(false);
  return <details className="bankPrompt" onClick={event => event.stopPropagation()} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Посмотреть условие</summary>
    {open && <MarkdownContent source={source}/>}
  </details>;
}

const options = items => items.map(({id,title}) => ({value:id, content:title}));

function BankEditor({linkedWorks, initial, tasks, onClose, onSave}) {
  const [item,setItem] = useState(initial);
  const [error,setError] = useState("");
  const isTask = item.kind === "program";
  const update = patch => setItem(previous => ({...previous,...patch}));
  function submit(event) {
    event.preventDefault();
    const problem = item.kind !== "theory" ? contentError([item]) : !item.prompt.trim() && "Введите теоретический вопрос.";
    if (problem || !item.title.trim()) return setError(problem || "Введите название.");
    try { onSave(savedActivity({...item,title:item.title.trim()})); }
    catch { setError("Не удалось сохранить изменения в этом браузере."); }
  }
  const canSubmit = !initial.existing || item !== initial;
  return <WorkspacePage title={item.kind === "quiz" ? (initial.existing ? "Редактирование теста" : "Новый тест") : isTask ? (initial.existing ? "Редактирование задачи" : "Новая задача") : "Теоретический вопрос"}
    returnAction={{label:"К банку",onClick:onClose}} actions={canSubmit && <>
    {error && <span role="alert">{error}</span>}
    <Button size="xl" view="action" type="submit" extraProps={{form:"bank-editor"}}>{initial.existing ? "Сохранить изменения" : "Создать"}</Button>
  </>}>
    <form className="subjectForm bankEditor" id="bank-editor" onSubmit={submit}>
      {linkedWorks}
      {item.kind !== "theory" ? <ActivityFields item={item} update={update}/> : <>
        <Input label="Название вопроса" value={item.title} onUpdate={title => update({title})}/>
        <Suspense fallback={<p>Загрузка редактора…</p>}>
          <MarkdownField label="Теоретический вопрос" placeholder="Как выбор структуры данных влияет на сложность поиска?"
            value={item.prompt} onChange={prompt => update({prompt})}/>
        </Suspense>
      </>}
      {!isTask && <fieldset><legend>Связанные задачи</legend>
          <Select aria-label="Связанные задачи" multiple filterable placeholder="Без привязки к задачам" value={item.taskIds}
            options={options(tasks)} onUpdate={taskIds => update({taskIds})}/>
        </fieldset>}
    </form>
  </WorkspacePage>;
}

export function TaskBank({linkedWorks,renderActivityWorks,subjects,tasks,bank,save,renderWorkspace}) {
  const [subject,setSubject] = useState("");
  const [query,setQuery] = useState("");
  const [section,setSection] = useState("tasks");
  const [preview,setPreview] = useState(null);
  const [editor,setEditor] = useState(null);
  const isTasks = section === "tasks";
  const materials = isTasks ? tasks : bank.questions;
  const byMaterial = new Map(materials.map(row => [row.id,linkedWorks(row)]));
  const compare = new Intl.Collator("ru",{numeric:true}).compare;
  const orderedSubjects = [...subjects].sort((a,b) => compare(subjectSelectLabel(a),subjectSelectLabel(b)));
  const rank = new Map(orderedSubjects.map((s,i) => [s.id,i]));
  const firstSubject = row => byMaterial.get(row.id).reduce((first,work) =>
    Math.min(first,rank.get(work.subject) ?? subjects.length),subjects.length);
  const rows = materials.filter(row => (!subject || byMaterial.get(row.id).some(work => work.subject === subject)) &&
    (row.title + " " + promptOf(row)).toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a,b) => firstSubject(a) - firstSubject(b) || compare(a.title,b.title));
  function edit(item) { setEditor(item); }
  function editExisting(row) {
    setPreview(null);
    edit({...row,existing:true});
  }
  if (preview) return <WorkspacePage title={preview.title} returnAction={{label:"К банку",onClick:() => setPreview(null)}}
    actions={<Button size="l" view="action" onClick={() => editExisting(preview)}>{preview.kind === "quiz" ? "Редактировать тест" : "Редактировать задачу"}</Button>}>
    <div className="subjectInfo">
      {renderActivityWorks(preview)}
      <section className="assignmentLayout">
        <TeacherActivityPreview item={preview}/>
      </section>
    </div>
  </WorkspacePage>;
  if (editor) return <BankEditor linkedWorks={editor.existing && ["program","quiz"].includes(editor.kind) && renderActivityWorks(editor)} initial={editor} tasks={tasks} onClose={() => setEditor(null)}
    onSave={({existing, ...record}) => {
      save(current => ({...current, [section]:[...current[section].filter(row => row.id !== record.id),record]}));
      setEditor(null);
    }}/>;
  return renderWorkspace(<article className="bankPage">
    <h1>Банк задач и тестов</h1>
    <div className="assignmentControls">
      <Select aria-label="Раздел банка" value={[section]} options={[{value:"tasks",content:"Задачи"},{value:"questions",content:"Тесты"}]}
        onUpdate={([value]) => {setSection(value); setQuery("");}}/>
      <SubjectFilter subjects={orderedSubjects} value={subject} onChange={setSubject}/>
      <Button view="action" onClick={() => edit(isTasks ? newActivity("program") : {...newActivity("quiz"),taskIds:[]})}>{isTasks ? "Создать задачу" : "Создать тест"}</Button>
    </div>
    <TextInput controlProps={{"aria-label":"Поиск по банку"}} placeholder="Найти по названию или условию" value={query} onUpdate={setQuery} hasClear/>
    <JsonImport template="tasks" onImport={data => {
      let count;
      save(current => {
        const added = readBank(data,current);
        count = added.tasks.length + added.questions.length;
        return {...current, tasks:[...current.tasks,...added.tasks], questions:[...current.questions,...added.questions]};
      });
      return count;
    }}/>
    <CatalogueTable label={isTasks ? "Задачи банка" : "Тесты банка"} rows={rows}
      onOpen={row => row.kind === "theory" || !row.kind ? editExisting(row) : setPreview(row)}
      icon={() => isTasks ? Code : ListUl}
      details={row => (row.kind === "theory" || !row.kind) && <PromptPreview source={row.prompt}/>}
      columns={[{id:"works",name:"Практические работы",width:"50%",template:row =>
        <WorkLabels works={byMaterial.get(row.id)}/>}]}
      emptyMessage={query.trim() || subject ? "По выбранным условиям материалов нет." : isTasks ? "Задач пока нет." : "Тестов пока нет."}/>
  </article>);
}
