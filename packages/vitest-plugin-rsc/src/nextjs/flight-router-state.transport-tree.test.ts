import { expect, test, vi } from "vitest";

const createFullTransportTreeFromLoaderTree = vi.fn(async (..._args: unknown[]) => ({
  transportNode: true,
}));
const transportNodeToFlightRouterState = vi.fn(() => ["", {}, null, null, 1] as const);
const legacyCreateFlightRouterStateFromLoaderTree = vi.fn();

vi.mock("next/dist/server/app-render/create-transport-tree-from-loader-tree.js", () => ({
  createFullTransportTreeFromLoaderTree,
}));
vi.mock("next/dist/shared/lib/rsc-transport.js", () => ({
  transportNodeToFlightRouterState,
}));
vi.mock("next/dist/server/app-render/create-flight-router-state-from-loader-tree.js", () => ({
  createFlightRouterStateFromLoaderTree: legacyCreateFlightRouterStateFromLoaderTree,
}));

const { buildFlightRouterStateWithNext } = await import("./flight-router-state.ts");

test("prefers Next 16.4 canary's transport-tree pipeline over the removed loader-tree helper", async () => {
  const tree = await buildFlightRouterStateWithNext("/notes/[id]", "/notes/1", "?a=1");

  expect(createFullTransportTreeFromLoaderTree).toHaveBeenCalledTimes(1);
  const args = createFullTransportTreeFromLoaderTree.mock.calls[0]!;
  expect(Array.isArray(args[0])).toBe(true); // loaderTree
  expect(args[1]).toBeNull(); // hintTree
  expect(args[2]).toBe(false); // prefetchInliningEnabled
  expect(args[3]).toBe("none"); // missingPrefetchHintPolicy
  expect(args[4]).toBe(false); // partialPrefetching
  expect(typeof args[5]).toBe("function"); // getDynamicParamFromSegment
  expect(args[6]).toEqual({ a: "1" }); // searchParams

  expect(transportNodeToFlightRouterState).toHaveBeenCalledWith({ transportNode: true });
  expect(legacyCreateFlightRouterStateFromLoaderTree).not.toHaveBeenCalled();
  expect(tree).toEqual(["", {}, null, null, 1]);
});
