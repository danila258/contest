import React from "react";
import {Text} from "@gravity-ui/uikit";
import {subjectSelectLabel} from "./semester";

export function ActivityWorks({works, subjects}) {
  return <fieldset className="activityWorks">
    <legend>Практические работы</legend>
    {works.length ? <ul>{works.map(work => <li key={work.id}>
      <Text variant="body-1">{work.title}</Text>
      <Text color="secondary" variant="body-1">{subjectSelectLabel(subjects.get(work.subject))}</Text>
    </li>)}</ul> : <Text color="secondary">Пока не используется в практических работах.</Text>}
  </fieldset>;
}
