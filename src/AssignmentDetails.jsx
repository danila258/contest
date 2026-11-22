import React, {useState} from "react";
import {Button, Card, Icon, Menu, Select, Text, TextInput} from "@gravity-ui/uikit";
import {ChevronLeft, ChevronRight} from "@gravity-ui/icons";
import {WorkspacePage} from "./WorkspacePage";
import MarkdownContent from "./MarkdownContent";

const date = value => new Date(value).toLocaleString("ru-RU", {dateStyle:"long", timeStyle:"short"});

export function AssignmentDetails({work, subject, teacher, editBlocked, editError, onEdit, returnAction}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const showNavigation = !teacher && work.activities.length > 1;
  const options = work.activities.map((item, index) => ({
    value: String(index), content: `${index + 1}. ${item.title}`,
    disabled: Boolean(work.sequential && index > 0)
  }));
  const matchingOptions = options.filter(option => option.content.toLowerCase().includes(query.trim().toLowerCase()));
  const nextOption = options[selectedIndex + 1];
  return <WorkspacePage title={work.title} returnAction={returnAction} actions={teacher ? <>
    {(editBlocked || editError) && <Text role="status">{editBlocked || editError}</Text>}
    <Button disabled={Boolean(editBlocked)} view="action" size="l" onClick={onEdit}>Редактировать работу</Button>
  </> : showNavigation && <>
    <Button view="outlined" size="l" disabled={selectedIndex === 0} onClick={() => setSelectedIndex(selectedIndex - 1)}>
      <Button.Icon><Icon data={ChevronLeft}/></Button.Icon>Назад
    </Button>
    {nextOption && (
      <Button view="action" size="l" disabled={nextOption.disabled} onClick={() => setSelectedIndex(selectedIndex + 1)}>
        Далее<Button.Icon side="end"><Icon data={ChevronRight}/></Button.Icon>
      </Button>
    )}
  </>}>
    <div className="subjectInfo">
      <Text color="secondary">{subject.title}</Text>
      <div>Открытие доступа — {date(work.opensAt)}<br/>Сдать до {date(work.dueAt)}</div>
      {work.sequential && <div>Задания открываются по порядку после успешной проверки.</div>}
      {work.review && <div>Для зачёта требуется подтверждение преподавателя.</div>}
      {!work.activities.length && <p>В этой работе пока нет заданий.</p>}
      <section className={showNavigation ? "assignmentLayout withNavigation" : "assignmentLayout"}>
      {showNavigation && <nav aria-label="Задания работы">
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
      {work.activities.map((item,index) => (teacher || index === selectedIndex) && <Card key={item.id}>
        <Text color="secondary">{item.kind === "quiz" ? "Тест" : "Задача на программирование"}</Text>
        <h2>{index + 1}. {item.title}</h2>
        {item.kind === "quiz" ? <>
            <p>Попыток — {item.attempts}. Для зачёта — {item.threshold} из {item.questions.length}.</p>
            {item.questions.map((q,i) => <section key={q.id}><h3>Вопрос {i+1}</h3>
              <MarkdownContent source={q.prompt}/>
              <ul>{q.answers.map(a => <li key={a.id}>{a.text}{teacher && a.correct && " ✓"}</li>)}</ul>
            </section>)}
          </> : <><MarkdownContent source={item.prompt}/>
            {item.minutes && <p>Время на решение — {item.minutes} мин.</p>}
            {teacher && <p>Проверка — {item.mode === "stdout" ? "STDOUT" : "unit-тесты"}. Проверочных тестов — {item.cases.length}.</p>}
          </>}
      </Card>)}
      </section>
    </div>
  </WorkspacePage>;
}
