import React, {useState} from "react";
import {Label, Text} from "@gravity-ui/uikit";
import {useVisibleLabels} from "./useVisibleLabels";

export function WorkLabels({works}) {
  const {row, labels, counter, limit} = useVisibleLabels(works);
  const [expanded,setExpanded] = useState(false);
  if (!works.length) return <Text color="secondary">Не прикреплено</Text>;
  const hidden = works.length - limit;
  const badges = works.map(work => <Label key={work.id} size="s">{work.title}</Label>);
  return <div className="groupLabels workLabels" ref={row}>
    {expanded && hidden > 0
      ? <ul>{works.map(work => <li key={work.id}>{work.title}</li>)}</ul>
      : badges.slice(0,limit)}
    {hidden > 0 && <button type="button" className="workLabelsToggle" aria-expanded={expanded}
      onClick={event => {event.stopPropagation(); setExpanded(!expanded);}}>
      {expanded ? "Свернуть" : `ещё ${hidden}`}
    </button>}
    <div aria-hidden="true" className="groupMeasure" ref={labels}>{badges}</div>
    <span aria-hidden="true" className="groupMeasure"><span ref={counter} className="workLabelsToggle"/></span>
  </div>;
}
