export const subjects = [
  {
    id: "cpp",
    title: "Программирование на C++",
    teacher: "Ирина Волкова",
    semesterNumber: 1,
    academicYear: "2026/2027",
    motif: "code",
  },
  {
    id: "alg",
    title: "Алгоритмы и структуры данных",
    teacher: "Андрей Соколов",
    semesterNumber: 1,
    academicYear: "2026/2027",
    motif: "tree",
  },
  {
    id: "math",
    title: "Дискретная математика",
    teacher: "Мария Орлова",
    semesterNumber: 1,
    academicYear: "2026/2027",
    motif: "wave",
  },
];

export const works = [
  {
    id: "arrays",
    subject: "cpp",
    title: "Массивы и строки",
    day: 1,
    state: "В работе",
    task: "Считайте строку и выведите её длину.",
  },
  {
    id: "sort",
    subject: "alg",
    title: "Алгоритмы сортировки",
    day: 3,
    state: "Доступна",
    task: "Считайте пять целых чисел и выведите их в порядке возрастания.",
  },
  {
    id: "logic",
    subject: "math",
    title: "Булева алгебра",
    day: 5,
    state: "Доступна",
    question: "Каков результат операции 1 И 0?",
    answers: ["0", "1"],
    correct: "0",
  },
  {
    id: "loops",
    subject: "cpp",
    title: "Условия и циклы",
    day: -1,
    state: "Зачтено",
    task: "Выведите все чётные числа от 1 до 10.",
  },
  {
    id: "search",
    subject: "alg",
    title: "Линейный поиск",
    day: -2,
    state: "Зачтено",
    task: "Найдите первое вхождение числа в массив.",
  },
  {
    id: "sets",
    subject: "math",
    title: "Операции над множествами",
    day: -3,
    state: "Зачтено",
    question: "Как обозначается пересечение?",
    answers: ["∩", "∪"],
    correct: "∩",
  },
];
export function deadline(day) {
  const date = new Date();
  date.setDate(date.getDate() + day);
  return date;
}
export const starter =
  "#include <iostream>\n\nint main() {\n    \n    return 0;\n}\n";
