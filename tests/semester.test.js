import assert from "node:assert/strict";
import test from "node:test";
import {currentSemester, inCurrentSemester} from "../src/semester.js";

test("the overview switches from odd to even semesters at midnight on February 5", () => {
  const academicYear = "2026/2027";
  for (const [input, season] of [
    ["2027-02-01T00:00:00", "autumn"],
    ["2027-02-04T23:59:59.999", "autumn"],
    ["2027-02-05T00:00:00", "spring"],
    ["2027-08-31T23:59:59.999", "spring"],
  ]) {
    const current = currentSemester(new Date(input));
    assert.deepEqual(current, {season, academicYear});
    assert.equal(inCurrentSemester({semesterNumber:3, academicYear}, current), season === "autumn");
    assert.equal(inCurrentSemester({semesterNumber:4, academicYear}, current), season === "spring");
  }
  assert.deepEqual(currentSemester(new Date("2027-09-01T00:00:00")), {season:"autumn", academicYear:"2027/2028"});
});
