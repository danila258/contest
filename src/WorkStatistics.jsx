import React from "react";
import {Table} from "@gravity-ui/uikit";
import {demoStudent, students, studentHasAccess} from "./subjectOptions";

export function WorkStatistics({subject, work, currentTotal, activityAttempts, submissions, status}) {
  const items = work.activities;
  const histories = items?.map(item => activityAttempts[item.id]?.history ?? []);
  const total = items?.length ?? 1;
  const passed = histories ? histories.filter(history => history.at(-1)?.status === "Зачтено").length
    : Number(status === "Зачтено");
  const attempts = histories ? histories.reduce((sum, history) => sum + history.length, 0) : submissions.length;
  const rows = students.filter(student => studentHasAccess(subject, student)).map(student => {
    const own = student.id === demoStudent.id;
    return {...student, status:own ? status : "Не приступал", progress:`${own ? passed : 0} из ${own ? total : currentTotal}`, attempts:own ? attempts : 0};
  });
  return <section><h2>Статистика выполнения</h2>
    <Table width="max" wordWrap data={rows} getRowDescriptor={row => ({id:row.id})}
      emptyMessage="В этом предмете нет студентов с доступом." columns={[
        {id:"name",name:"Студент"},{id:"group",name:"Группа"},{id:"status",name:"Статус"},
        {id:"progress",name:"Зачтено заданий"},{id:"attempts",name:"Завершено попыток"},
      ]}/>
  </section>;
}
