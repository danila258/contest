import { dateTime } from "@gravity-ui/date-utils";

export const semesterOptions = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  content: String(index + 1),
}));

export function semesterNumberOf(subject) {
  const number = subject?.semesterNumber;
  if (Number.isInteger(number) && number >= 1 && number <= 12) return number;
  // Records created before semester numbering only identify the season.
  if (subject?.season === "autumn") return 1;
  if (subject?.season === "spring") return 2;
  return undefined;
}

export function inCurrentSemester(subject, current) {
  const number = semesterNumberOf(subject);
  return number !== undefined && academicYearOf(subject) === current.academicYear &&
    number % 2 === (current.season === "spring" ? 0 : 1);
}

function yearPair(start) {
  return `${start}/${start + 1}`;
}

export function currentSemester(input = new Date()) {
  const date = dateTime({ input });
  const month = date.month() + 1;
  return {
    season: month >= 2 && month <= 8 ? "spring" : "autumn",
    academicYear: yearPair(date.year() - (month < 9 ? 1 : 0)),
  };
}

export function validAcademicYear(value) {
  if (!/^[1-9]\d{3}\/[1-9]\d{3}$/.test(value)) return false;
  const [start, end] = value.split("/").map(Number);
  return end === start + 1;
}

export function academicYearOptions(current, selected) {
  const start = Number(current.slice(0, 4));
  const options = Array.from({ length: 4 }, (_, offset) => {
    const value = yearPair(start + offset);
    return { value, content: value };
  });
  if (validAcademicYear(selected) && !options.some(option => option.value === selected)) {
    options.unshift({ value: selected, content: selected, disabled: true });
  }
  return options;
}

export function academicYearOf(subject) {
  if (subject?.academicYear) return subject.academicYear;
  // Older records store the calendar year in which the semester began.
  if (subject?.year && subject.season) {
    return yearPair(Number(subject.year) - (subject.season === "spring" ? 1 : 0));
  }
  return undefined;
}

export function semesterLabel(subject) {
  const number = semesterNumberOf(subject);
  const year = academicYearOf(subject);
  return number && year ? `Семестр ${number} · ${year}` : "Семестр не указан";
}
