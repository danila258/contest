import React from "react";
import {Select} from "@gravity-ui/uikit";

export function SubjectFilter({subjects, value, onChange}) {
  return <Select aria-label="Фильтр по предмету" filterable value={[value]}
    options={[{value:"", content:"Все предметы"}, ...subjects.map(s => ({value:s.id, content:s.title}))]}
    onUpdate={([id]) => onChange(id)}/>;
}
