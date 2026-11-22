export const demoTeacher = "Ирина Волкова";
export const demoGroup = "ИВТ-24";
export const groups = [demoGroup, "ИВТ-25", "ПИ-24"];
export const demoStudent = {id:"student-anna", name:"Смирнова Анна Сергеевна", group:demoGroup};
export const students = [
  demoStudent,
  {id:"student-ivan", name:"Петров Иван Алексеевич", group:"ИВТ-25"},
  {id:"student-elena", name:"Соколова Елена Андреевна", group:"ПИ-24"},
];

export function studentHasAccess(subject, student) {
  if (!subject.groups && !subject.studentIds) return true;
  return Boolean(subject.groups?.includes(student.group) || subject.studentIds?.includes(student.id));
}

export const teachers = [demoTeacher, "Андрей Соколов", "Мария Орлова"];

export const colors = {
  blue: "Синий",
  green: "Зелёный",
  purple: "Фиолетовый",
  orange: "Оранжевый",
  gray: "Серый",
  red: "Красный",
  yellow: "Жёлтый",
  teal: "Бирюзовый",
  pink: "Розовый",
  indigo: "Индиго",
};
export const iconNames = ["code", "tree", "wave", "database", "cpu", "book", "globe", "terminal", "chart", "molecule"];
