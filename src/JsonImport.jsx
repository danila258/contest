import React, {useRef, useState} from "react";
import {Button, Dialog} from "@gravity-ui/uikit";

export function JsonImport({template, onImport, successMessage, importLabel = "Импортировать JSON", templateLabel = "Скачать шаблон JSON"}) {
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
      <Button href={`/${template}-template.json`} extraProps={{download:`${template}-template.json`}}>{templateLabel}</Button>
      <Button ref={trigger} loading={loading} onClick={() => input.current.click()}>{importLabel}</Button>
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
