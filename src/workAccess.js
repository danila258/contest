import {useEffect, useState} from "react";

const lockName = id => `practice.work:${id}`;
export const editInProgress = "Преподаватель редактирует работу. Дождитесь окончания редактирования.";
export const alreadyStarted = "Студент уже начал работу. Редактирование закрыто.";

export function workHasStarted(work) {
  const read = key => JSON.parse(localStorage.getItem("practice." + key)) ?? {};
  return Object.hasOwn(read("starts"), work.id) || Object.hasOwn(read("drafts"), work.id)
    || Boolean(read("attempts")[work.id]?.length) || work.state === "Зачтено";
}

export function withWorkAccess(id, action) {
  if (!navigator.locks) throw new Error("Для доступа к работе откройте приложение через HTTPS или localhost.");
  return navigator.locks.request(lockName(id), {ifAvailable:true}, lock => {
    if (!lock) throw new Error(editInProgress);
    return action();
  });
}

// Web Locks releases the editor's lock even if its tab closes unexpectedly.
export function useWorkBusy(id) {
  const [busyId, setBusyId] = useState(null);
  useEffect(() => {
    if (!id || !navigator.locks) return;
    let observing = true;
    async function refresh() {
      const {held} = await navigator.locks.query();
      if (observing) setBusyId(held.some(lock => lock.name === lockName(id)) ? id : null);
    }
    refresh();
    const interval = setInterval(refresh, 500);
    return () => { observing = false; clearInterval(interval); };
  }, [id]);
  return Boolean(id && busyId === id);
}
