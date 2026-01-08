/// <reference types="@vitest/browser/context" />

// @ts-ignore
globalThis.process = { env: {} };

import { beforeAll, beforeEach } from "vitest";
import { cleanup, initialize } from "vitest-plugin-rsc/testing-library";

beforeAll(() => {
  initialize();
});

beforeEach(async () => {
  await cleanup();
});

