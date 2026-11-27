import test from "node:test";
import assert from "node:assert/strict";

import { pageWindow } from "./pagination.ts";

test("a valid page keeps its requested number and range", () => {
  assert.deepEqual(pageWindow(2, 96, 25), {
    page: 2,
    totalPages: 4,
    start: 25,
    end: 49,
    firstRow: 26,
    lastRow: 50,
  });
});

test("the last page is clamped to the real page count", () => {
  const w = pageWindow(9, 7, 25);
  assert.equal(w.page, 1);
  assert.equal(w.totalPages, 1);
  assert.equal(w.start, 0);
  assert.equal(w.firstRow, 1);
  assert.equal(w.lastRow, 7);
});

test("a page beyond the total never asks PostgREST for an invalid offset", () => {
  const w = pageWindow(400, 7, 25);
  assert.equal(w.page, 1);
  assert.equal(w.start, 0);
  assert.equal(w.end, 24);
});

test("an empty total has one empty page", () => {
  const w = pageWindow(3, 0, 25);
  assert.equal(w.page, 1);
  assert.equal(w.totalPages, 1);
  assert.equal(w.firstRow, 0);
  assert.equal(w.lastRow, 0);
});

test("fractional and negative pages are normalised", () => {
  assert.equal(pageWindow(2.7, 100, 25).page, 2);
  assert.equal(pageWindow(-4, 100, 25).page, 1);
});
