import React from "react";
import {Card, Text} from "@gravity-ui/uikit";

import {subjectSelectLabel} from "./semester";
import MarkdownContent from "./MarkdownContent";

export function WorkSubject({subject}) {
  return <fieldset className="workSubject">
    <legend>Предмет</legend>
    <span>{subjectSelectLabel(subject)}</span>
  </fieldset>;
}

export function WorkDescription({description}) {
  if (!description?.trim()) return null;
  return <section><h2>Темы для подготовки</h2><MarkdownContent source={description}/></section>;
}

export const formatWorkDate = value => new Date(value).toLocaleString("ru-RU", {dateStyle:"long", timeStyle:"short"});

export function WorkSummary({opensAt, dueAt, conditions}) {
  return <Card className="workSummary">
    <dl className="workSummaryDates">
      {[["Открытие доступа",opensAt],["Сдать до",dueAt]].filter(([,value]) => value).map(([label,value]) =>
        <div key={label}>
          <dt><Text color="secondary">{label}</Text></dt>
          <dd><Text variant="subheader-2"><time dateTime={value}>{formatWorkDate(value)}</time></Text></dd>
        </div>
      )}
    </dl>
    {conditions.length > 0 && <ul className="workSummaryConditions">
      {conditions.map(condition => <li key={condition}>{condition}</li>)}
    </ul>}
  </Card>;
}

export function Facts({rows}) {
  return <dl className="previewFacts">{rows.filter(([,value]) => value != null).map(([label,value]) =>
    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
  )}</dl>;
}
