import {files} from "./activityData.js";
import {starter} from "./data.js";

export function sourceFiles(item) {
  return item.mode === "unit" ? files : ["main.cpp"];
}

export function beginAttempt(item, time) {
  const base = {started:time, questionStarted:time, index:0};
  if (item.kind !== "quiz") return {...base,sources:Object.fromEntries(sourceFiles(item).map(name =>
    [name,item.sources?.[name] ?? (name === "main.cpp" ? starter : "")]))};
  const order = item.questions.map(q => {
    const ids = q.answers.map(a => a.id);
    if (item.shuffle) {
      for (let i=ids.length-1; i>0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [ids[i],ids[j]] = [ids[j],ids[i]];
      }
    }
    return ids;
  });
  return {...base,answers:{},order};
}

export function finishAttempt(item, state, time) {
  const {draft,history} = state;
  const result = {draft, time, status:"Отправлено"};
  if (item.kind === "quiz") {
    result.score = item.questions.filter(q => {
      const chosen = draft.answers[q.id] ?? [];
      return q.answers.every(a => chosen.includes(a.id) === Boolean(a.correct));
    }).length;
    result.status = result.score >= Number(item.threshold) ? "Зачтено" : "На доработке";
  }
  return {draft:null,history:[...history,result]};
}

export function attemptDeadline(item,draft,due) {
  const perQuestion = item.kind === "quiz" && item.timer === "question";
  const minutes = perQuestion ? item.questions[draft.index].minutes : item.minutes;
  const start = perQuestion ? draft.questionStarted : draft.started;
  return minutes ? Math.min(due,start+Number(minutes)*60000) : due;
}

// Advance overdue questions in order, including time spent outside the work.
export function expireAttempt(item,state,due,now) {
  while (state.draft) {
    const end = attemptDeadline(item,state.draft,due);
    if (now < end) break;
    const {draft} = state;
    if (item.kind !== "quiz" || item.timer !== "question" || end >= due || draft.index+1 >= item.questions.length) {
      return finishAttempt(item,state,end);
    }
    state = {...state,draft:{...draft,index:draft.index+1,questionStarted:end}};
  }
  return state;
}
