import { expect, test } from "vitest";

test("runs inside the workers pool", () => {
  expect(typeof globalThis).toBe("object");
});

