import React from "react";
import { Label, Text } from "@gravity-ui/uikit";

import {useVisibleLabels} from "./useVisibleLabels";

export function SubjectGroups({ groups }) {
  const {row, labels, counter, limit} = useVisibleLabels(groups);
  const hidden = groups.length - limit;
  const badges = groups.map((group) => (
    <Label key={group} size="s">
      {group}
    </Label>
  ));
  return (
    <div className="subjectGroups">
      <Text variant="caption-2" color="secondary">
        Группы с доступом
      </Text>
      {groups.length ? (
        <div className="groupLabels" ref={row} title={groups.join(", ")}>
          {badges.slice(0, limit)}
          {hidden > 0 && <Text variant="caption-2">ещё {hidden}</Text>}
          <div aria-hidden="true" className="groupMeasure" ref={labels}>
            {badges}
          </div>
          <span aria-hidden="true" className="groupMeasure">
            <Text ref={counter} variant="caption-2" />
          </span>
        </div>
      ) : (
        <Text variant="caption-2">Группы не выбраны</Text>
      )}
    </div>
  );
}
