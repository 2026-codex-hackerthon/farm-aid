import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../app/page.tsx", import.meta.url);

test("MVP is scoped to livestock damage", async () => {
  const page = await readFile(pageUrl, "utf8");
  assert.match(page, /축산 피해 현장 기록 시작하기/);
  assert.match(page, /livestockType/);
  assert.match(page, /normalCount/);
  assert.match(page, /insuranceEnrolled/);
  assert.match(page, /가축재해보험 사고접수/);
  assert.doesNotMatch(page, /농작물|경작면적|사과나무|비닐하우스|과수원/);
});

test("separates user statements from official confirmation", async () => {
  const page = await readFile(pageUrl, "utf8");
  assert.match(page, /A 자동입력/);
  assert.match(page, /B 사용자 확인/);
  assert.match(page, /C 기관 확인/);
  assert.match(page, /공식 피해규모·지원 자격·보험금은 기관 확인/);
});
