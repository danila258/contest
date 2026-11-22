import React, { useLayoutEffect, useRef, useState } from "react";
import { Label, Text } from "@gravity-ui/uikit";

export function SubjectGroups({ groups }) {
  const row = useRef(null);
  const labels = useRef(null);
  const counter = useRef(null);
  const [limit, setLimit] = useState(groups.length);

  useLayoutEffect(() => {
    if (!groups.length) return;
    function measure() {
      const available = row.current.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(labels.current).columnGap);
      const start = labels.current.getBoundingClientRect().left;
      const items = labels.current.children;
      let count = 0;
      let end = 0;
      while (count < items.length) {
        end = items[count].getBoundingClientRect().right - start;
        if (end > available) break;
        count++;
      }
      // Reserve room for the exact overflow text only when some labels are hidden.
      if (count < items.length) {
        while (count > 0) {
          counter.current.textContent = "ещё " + (items.length - count);
          end = items[count - 1].getBoundingClientRect().right - start;
          if (
            end + gap + counter.current.getBoundingClientRect().width <=
            available
          )
            break;
          count--;
        }
      }
      setLimit(count);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row.current);
    observer.observe(labels.current);
    return () => observer.disconnect();
  }, [groups]);

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
        <Text variant="caption-2">Доступ не выдан</Text>
      )}
    </div>
  );
}
