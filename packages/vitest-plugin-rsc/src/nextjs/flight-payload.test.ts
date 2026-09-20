import { createElement, type ReactNode } from "react";
import { expect, test, vi } from "vitest";

// The real NextRouter boots Next's client App Router, which needs the browser
// projects. The payload builders only look for the router element marker.
const NextRouter = vi.hoisted(() =>
  Object.assign((_props: { url: string; route: string; children?: ReactNode }) => null, {
    $$vitestPluginRscNextRouter: true as const,
  }),
);
vi.mock("vitest-plugin-rsc/nextjs/client", () => ({ NextRouter }));

const { createNextActionResponse, createNextRouteResponse } = await import("./flight-payload.ts");

const children = "rendered children";
const root = createElement(NextRouter, { url: "/note/1", route: "/note/[id]" }, children);

// Next <= 16.3 reads `f`, Next 16.4 reads `t`. Both must be present whichever
// Next version is installed, so neither shape can silently drop out.
test("route responses carry both the FlightData path and the transport tree", async () => {
  const response = await createNextRouteResponse(root, "http://localhost/note/1?a=1");

  expect(response.q).toBe("?a=1");
  expect(response.f).toHaveLength(1);
  expect(response.t?.t).toMatchObject({ s: "", d: { r: children, p: false, v: null } });
  expect(response.t?.h).toEqual({ r: null, p: false, v: null });
});

test("action responses that rerender carry both the FlightData path and the transport tree", async () => {
  const response = await createNextActionResponse(root, "result", true);

  await expect(response.a).resolves.toBe("result");
  expect(response.f).toHaveLength(1);
  expect(response.t?.t).toMatchObject({ s: "", d: { r: children, p: false, v: null } });
});

test("action responses that skip rendering carry no tree in either shape", async () => {
  const response = await createNextActionResponse(root, "result", false);

  expect(response.f).toBe("");
  expect(response.t).toBeUndefined();
});
