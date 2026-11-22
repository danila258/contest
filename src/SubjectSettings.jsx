import React, { useState } from "react";
import { Select, Button, TextInput } from "@gravity-ui/uikit";

import { FormRow } from "@gravity-ui/components";

import { academicYearOptions, academicYearOf, currentSemester, semesterNumberOf, semesterOptions, validAcademicYear } from "./semester";
import { CoverPicker, coverSettings } from "./SubjectCover";
import { WorkspacePage } from "./WorkspacePage";

const MarkdownField = React.lazy(() => import("./MarkdownField"));

import {demoGroup, demoTeacher, groups, teachers} from "./subjectOptions";

export function SubjectSettings({ subject, copying = false, onSave, onClose }) {
  const current = currentSemester();
  const owner = copying ? demoTeacher : subject?.teacher ?? demoTeacher;
  const sourceYear = academicYearOf(subject) ?? current.academicYear;
  const years = academicYearOptions(current.academicYear);
  const copyYear = years.find(option => option.value > sourceYear)?.value ?? years.at(-1).value;
  const [error,setError] = useState("");
  const [form, setForm] = useState(() => ({
    ...coverSettings(subject),
    semesterNumber: semesterNumberOf(subject) ?? (current.season === "spring" ? 2 : 1),
    academicYear: copying ? copyYear : sourceYear,
    title: subject?.title ?? "",
    groups: subject?.groups ?? [demoGroup],
    teachers: [...new Set([owner, ...(subject?.teachers ?? [demoTeacher])])],
    description: subject?.description ?? "",
    faq: subject?.faq ?? "",
    review: subject?.review ?? "",
  }));
  function update(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }
  const yearValid = validAcademicYear(form.academicYear);
  const canSave = Boolean(form.title.trim()) && yearValid;
  function submit(event) {
    event.preventDefault();
    if (!canSave) return;
    try { onSave({ ...form, title: form.title.trim() }); }
    catch (failure) { setError(failure.message); }
  }
  const caption = copying ? "Копирование предмета" : subject ? "Настройки предмета" : "Новый предмет";
  return (
    <WorkspacePage
      title={caption}
      actions={
        <>
          {error && <span role="alert">{error}</span>}
          <Button size="xl" onClick={onClose}>
            Отмена
          </Button>
          <Button
            size="xl"
            view="action"
            type="submit"
            extraProps={{ form: "subject-settings" }}
            disabled={!canSave}
          >
            {copying ? "Создать копию" : subject ? "Сохранить" : "Создать"}
          </Button>
        </>
      }
    >
      <form className="subjectForm" id="subject-settings" onSubmit={submit}>
        {copying && <p>Практические работы будут скопированы со сдвигом сроков на выбранный учебный год. Задачи останутся в общем банке.</p>}
        <FormRow className="subjectTitleRow" direction="column" label="Название предмета" fieldId="subject-title" required>
          <TextInput
            id="subject-title"
            controlProps={{ required: true }}
            className="subjectTitleInput"
            size="l"
            placeholder="Например, алгоритмы и структуры данных"
            autoFocus
            value={form.title}
            onUpdate={(v) => update("title", v)}
          />
        </FormRow>
        <fieldset className="semesterFields">
          <legend>Семестр</legend>
          <FormRow direction="column" label="Номер семестра" fieldId="semester-number">
            <Select
              id="semester-number"
              aria-label="Номер семестра"
              size="l"
              width="max"
              value={[String(form.semesterNumber)]}
              options={semesterOptions}
              onUpdate={([value]) => update("semesterNumber", Number(value))}
            />
          </FormRow>
          <FormRow direction="column" label="Учебный год" fieldId="semester-year">
            <Select
              id="semester-year"
              aria-label="Учебный год"
              size="l"
              width="max"
              options={academicYearOptions(current.academicYear, form.academicYear)}
              value={[form.academicYear]}
              onUpdate={([value]) => update("academicYear", value)}
            />
          </FormRow>
        </fieldset>
        <CoverPicker color={form.color} icon={form.icon} onChange={update} />
        <div className="subjectAccess">
          <fieldset>
            <legend>Доступ для групп</legend>
            <Select
              aria-label="Доступ для групп"
              size="l"
              width="max"
              multiple
              filterable
              hasCounter
              placeholder="Выберите группы"
              filterPlaceholder="Введите название группы"
              renderEmptyOptions={() => <span>Группы не найдены</span>}
              value={form.groups}
              options={[
                ...new Set([...groups, ...(subject?.groups ?? [])]),
              ].map((value) => ({ value, content: value }))}
              onUpdate={(values) => update("groups", values)}
            />
          </fieldset>
          <fieldset>
            <legend>Преподаватели с доступом</legend>
            <Select
              aria-label="Преподаватели с доступом"
              size="l"
              width="max"
              multiple
              filterable
              hasCounter
              filterPlaceholder="Введите имя или фамилию"
              renderEmptyOptions={() => <span>Преподаватели не найдены</span>}
              value={form.teachers}
              options={[
                ...new Set([owner, ...teachers, ...(subject?.teachers ?? [])]),
              ].map((value) => ({
                value,
                content: value === owner ? value + " (автор)" : value,
                disabled: value === owner,
              }))}
              onUpdate={(values) =>
                update("teachers", [...new Set([owner, ...values])])
              }
            />
          </fieldset>
        </div>
        {[
          [
            "description",
            "Описание и критерии оценивания для студентов",
            "Чему научатся студенты и как вы будете оценивать их работы?",
          ],
          [
            "faq",
            "Частые вопросы и ответы для студентов",
            "О чём чаще всего спрашивают студенты? Запишите вопрос и ответ на него.",
          ],
          [
            "review",
            "Критерии приёма работ для преподавателей",
            "Что нужно проверить, прежде чем зачесть работу?",
          ],
        ].map(([key, label, placeholder]) => (
          <React.Suspense key={key} fallback={<span>{label}…</span>}>
            <MarkdownField
              label={label}
              placeholder={placeholder}
              value={form[key]}
              onChange={(value) => update(key, value)}
            />
          </React.Suspense>
        ))}
      </form>
    </WorkspacePage>
  );
}
