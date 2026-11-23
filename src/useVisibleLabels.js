import {useLayoutEffect, useRef, useState} from "react";

export function useVisibleLabels(items) {
  const row = useRef(null);
  const labels = useRef(null);
  const counter = useRef(null);
  const [limit, setLimit] = useState(items.length);

  useLayoutEffect(() => {
    if (!items.length) return;
    function measure() {
      const available = row.current.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(labels.current).columnGap);
      const start = labels.current.getBoundingClientRect().left;
      const badges = labels.current.children;
      let count = 0;
      let end = 0;
      while (count < badges.length) {
        end = badges[count].getBoundingClientRect().right - start;
        if (end > available) break;
        count++;
      }
      // Reserve room for the exact overflow text only when some labels are hidden.
      if (count < badges.length) {
        while (count > 0) {
          counter.current.textContent = "ещё " + (badges.length - count);
          end = badges[count - 1].getBoundingClientRect().right - start;
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
  }, [items]);

  return {row, labels, counter, limit};
}
