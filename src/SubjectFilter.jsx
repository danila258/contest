import React from "react";
import {Select} from "@gravity-ui/uikit";

import {subjectSelectLabel} from "./semester";

export function SubjectFilter({subjects, value, onChange}) {
  return <Select aria-label="Фильтр по предмету" filterable value={[value]}
    options={[{value:"", content:"Все предметы"}, ...subjects.map(s => ({value:s.id, content:subjectSelectLabel(s)}))]}
    onUpdate={([id]) => onChange(id)}/>;
}
