/// <reference types="vite/client" />

import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { renderServer, cleanup } from "vitest-plugin-rsc/testing-library";
import { ServerCounter } from "../action/server.tsx";
import { ClientCounter } from "../client-counter/client.tsx";

const options = {
  iterations: Number(import.meta.env.VITE_PERF_BENCH_ITERATIONS ?? 10),
  time: Number(import.meta.env.VITE_PERF_BENCH_TIME_MS ?? 250),
  warmupIterations: Number(import.meta.env.VITE_PERF_BENCH_WARMUP_ITERATIONS ?? 2),
  warmupTime: Number(import.meta.env.VITE_PERF_BENCH_WARMUP_TIME_MS ?? 100),
};

describe("RSC render helpers", () => {
  test("server component render", async ({ bench }) => {
    await bench("server component render", async () => {
      await withCleanup(async () => {
        await renderServer(<ServerCounter />);
        await expect.element(page.getByRole("button", { name: "server-counter: 0" })).toBeVisible();
      });
    }).run(options);
  });

  test("client component render and update", async ({ bench }) => {
    await bench("client component render and update", async () => {
      await withCleanup(async () => {
        await renderServer(<ClientCounter />);
        await page.getByRole("button", { name: "client-counter: 0" }).click();
        await expect.element(page.getByRole("button", { name: "client-counter: 1" })).toBeVisible();
      });
    }).run(options);
  });
});

async function withCleanup(callback: () => Promise<void>): Promise<void> {
  try {
    await callback();
  } finally {
    await cleanup();
  }
}
