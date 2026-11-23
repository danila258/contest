import React, {useRef, useState} from "react";
import {Button, Dialog, HelpMark} from "@gravity-ui/uikit";

const importHelp = {
  subjects: "Если вы готовите несколько предметов к новому семестру, их можно добавить одним файлом. Для каждого укажите название, семестр и учебный год.",
  works: "Если у вас есть план практических работ на семестр, перенесите в шаблон названия, сроки и задания. Все работы из файла появятся в списке за одну загрузку.",
  tasks: "Если у вас есть подборка задач или теоретических вопросов из методички, загрузите её в банк одним файлом. Материалы сохранятся в банке указанных предметов.",
  activities: "Если часть работы уже собрана, а ещё несколько заданий подготовлены отдельно, загрузите их одним файлом. Задания добавятся в конец работы в порядке из файла.",
  quiz: "Если вопросы и варианты ответов уже готовы, загрузите их вместе. Один тест из файла заменит текущий тест в форме. Проверьте, какие ответы отмечены как правильные.",
  program: "Если условие задачи, начальный код и проверки уже подготовлены, загрузите их вместе. Одна задача из файла заменит текущую задачу в форме.",
};

export function JsonImport({template, help = importHelp[template], onImport, successMessage, importLabel = "Импортировать JSON"}) {
  const trigger = useRef(null);
  const input = useRef(null);
  const [message,setMessage] = useState(null);
  const [failure,setFailure] = useState(null);
  const closeError = () => setFailure(null);
  const [loading,setLoading] = useState(false);
  async function upload(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    setLoading(true);
    setMessage(null);
    try {
      const data = JSON.parse((await file.text()).replace(/^\uFEFF/, ""));
      const count = onImport(data);
      setMessage(successMessage ?? `Добавлено записей: ${count}.`);
    } catch (error) {
      setFailure({file:file.name, detail:error.message});
    } finally {
      setLoading(false);
    }
  }
  return <>
    <div className="assignmentControls">
      <Button href={`/${template}-template.json`} extraProps={{download:`${template}-template.json`}}>Скачать шаблон JSON</Button>
      <Button ref={trigger} loading={loading} onClick={() => input.current.click()}>{importLabel}</Button>
      <HelpMark aria-label="Как работает импорт JSON">
        <p>{help}</p>
        <ol>
          <li>Нажмите «Скачать шаблон JSON».</li>
          <li>Замените примеры своими материалами. Для объёмных материалов рекомендуем передать шаблон и текст ИИ с просьбой заполнить поля и сохранить структуру файла.</li>
          <li>Проверьте данные, сохраните файл с расширением .json и выберите его кнопкой «{importLabel}».</li>
        </ol>
      </HelpMark>
      <input ref={input} hidden type="file" accept=".json,application/json" onChange={upload}/>
    </div>
    {message && <p role="status">{message}</p>}
    <Dialog open={Boolean(failure)} onClose={closeError} aria-label="Ошибка импорта JSON"
      maxWidth="s" fullWidth hasCloseButton={false} initialFocus="apply" returnFocus={trigger}>
      <Dialog.Header caption="Ошибка импорта JSON"/>
      <Dialog.Body className="importErrorBody">
        <p>Файл «{failure?.file}»</p>
        <p>{failure?.detail}</p>
      </Dialog.Body>
      <Dialog.Footer textButtonApply="Закрыть" onClickButtonApply={closeError}/>
    </Dialog>
  </>;
}
