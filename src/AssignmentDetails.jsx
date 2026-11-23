import React, {useState} from "react";
import {Button, Card, Icon, Menu, Select, Text, TextInput} from "@gravity-ui/uikit";
import {ChevronLeft, ChevronRight} from "@gravity-ui/icons";
import {WorkspacePage} from "./WorkspacePage";
import StudentActivity from "./StudentActivity";
import TeacherActivityPreview from "./TeacherActivityPreview";

import {formatWorkDate, WorkSummary} from "./WorkSummary";

export function AssignmentDetails({work, subject, teacher, activityAttempts, onActivityUpdate, editBlocked, editError, onEdit, returnAction}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const selected = work.activities[selectedIndex];
  const attempt = activityAttempts[selected?.id];
  const showTasks = !teacher && selected && (selected.kind !== "quiz" || (attempt?.history.length > 0 && !attempt.draft));
  const firstUnpassed = work.activities.findIndex(item => activityAttempts[item.id]?.history.at(-1)?.status !== "Зачтено");
  const options = work.activities.map((item, index) => ({
    value: String(index), content: `${index + 1}. ${item.title}`,
    disabled: Boolean(work.sequential && firstUnpassed >= 0 && index > firstUnpassed)
  }));
  const matchingOptions = options.filter(option => option.content.toLowerCase().includes(query.trim().toLowerCase()));
  const nextOption = options[selectedIndex + 1];
  const conditions = [
    work.sequential && "Задания открываются по порядку после успешной проверки.",
    work.review && "Для зачёта требуется подтверждение преподавателя.",
  ].filter(Boolean);
  return <WorkspacePage wide={!teacher} title={work.title} returnAction={returnAction} actions={teacher ? <>
    {(editBlocked || editError) && <Text role="status">{editBlocked || editError}</Text>}
    <Button disabled={Boolean(editBlocked)} view="action" size="l" onClick={onEdit}>Редактировать работу</Button>
  </> : null}>
    <div className={teacher ? "subjectInfo" : "studentWorkBody"}>
      <Text color="secondary">{subject.title}</Text>
      {teacher ? <WorkSummary opensAt={work.opensAt} dueAt={work.dueAt} conditions={conditions}/> : <>
        <div className="studentDates"><span>Открытие доступа — {formatWorkDate(work.opensAt)}</span><span>Сдать до {formatWorkDate(work.dueAt)}</span></div>
        {conditions.map(condition => <div key={condition}>{condition}</div>)}
      </>}
      {!work.activities.length && <p>В этой работе пока нет заданий.</p>}
      <section className={teacher ? "assignmentLayout" : "assignmentLayout studentAssignment"}>
      {showTasks && <nav aria-label="Задания работы">
        <Card className="assignmentSidebar">
          <Text variant="subheader-2">Задания</Text>
          {options.length > 6 && <TextInput placeholder="Найти задание" aria-label="Найти задание" value={query} onUpdate={setQuery} hasClear/>}
          <Menu size="l" aria-label="Выбрать задание">
            {matchingOptions.map(option => {
              const index = Number(option.value);
              return <Menu.Item key={option.value} selected={index === selectedIndex} disabled={option.disabled}
                extraProps={{"aria-current": index === selectedIndex ? "step" : undefined, "aria-disabled": option.disabled}}
                title={option.content} onClick={() => setSelectedIndex(index)}>
                {option.content}
              </Menu.Item>;
            })}
          </Menu>
          {!matchingOptions.length && <Text color="secondary">Заданий не найдено</Text>}
        </Card>
        <Select className="assignmentMobilePicker" label="Задание" aria-label="Выбрать задание" width="max" size="l" filterable
          value={[String(selectedIndex)]} onUpdate={([value]) => setSelectedIndex(Number(value))} options={options}/>
      </nav>}
      {work.activities.map((item,index) => {
        if (!teacher && index !== selectedIndex) return null;
        const heading = <header className={teacher ? "activitySummaryHeading" : undefined}>
          <Text color="secondary">{teacher && `${index + 1}. `}{item.kind === "quiz" ? "Тест" : "Задача на программирование"}</Text>
          <h2>{teacher ? item.title : `${index + 1}. ${item.title}`}</h2>
        </header>;
        if (teacher) return <Card key={item.id}>{heading}<TeacherActivityPreview item={item}/></Card>;
        return <StudentActivity key={item.id} item={item} heading={heading} state={activityAttempts[item.id]}
          due={Date.parse(work.dueAt)} update={transform => onActivityUpdate(item.id,transform)}>
          {showTasks && work.activities.length > 1 && (
          <nav className="activitySteps" aria-label="Переход между заданиями">
            {selectedIndex > 0 && <Button view="outlined" size="l" onClick={() => setSelectedIndex(selectedIndex - 1)}>
              <Button.Icon><Icon data={ChevronLeft}/></Button.Icon>Предыдущее задание
            </Button>}
            {nextOption && (
              <Button view="action" size="l" disabled={nextOption.disabled} onClick={() => setSelectedIndex(selectedIndex + 1)}>
                Следующее задание<Button.Icon side="end"><Icon data={ChevronRight}/></Button.Icon>
              </Button>
            )}
          </nav>
        )}
        </StudentActivity>;
      })}
      </section>
    </div>
  </WorkspacePage>;
}
