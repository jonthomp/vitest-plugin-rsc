import type { FlightRouterState } from "next/dist/shared/lib/app-router-types";
import { isValidElement } from "react";
import { expect, test } from "vitest";
import { createTransportDataFromFlightRouterState } from "./flight-transport-data.ts";

const children = "rendered children";

test("mirrors the router state as a Next 16.4 transport tree with the render output on every node", () => {
  const tree = [
    "",
    {
      children: [
        "note",
        { children: [["id", "someid", "d", null], { children: ["__PAGE__", {}] }] },
      ],
    },
  ] as FlightRouterState;

  expect(createTransportDataFromFlightRouterState(tree, children)).toEqual({
    t: {
      s: "",
      d: { r: children, p: false, v: null },
      c: new Map([
        [
          "children",
          {
            s: "note",
            d: { r: children, p: false, v: null },
            c: new Map([
              [
                "children",
                {
                  s: { n: "id", t: "d", k: "someid", s: null },
                  d: { r: children, p: false, v: null },
                  c: new Map([
                    ["children", { s: "__PAGE__", d: { r: children, p: false, v: null } }],
                  ]),
                },
              ],
            ]),
          },
        ],
      ]),
    },
    h: { r: null, p: false, v: null },
  });
});

test("carries the Next 16.4 prefetch hints bitmask onto the transport node", () => {
  const tree = ["", {}, null, null, 16] as unknown as FlightRouterState;

  expect(createTransportDataFromFlightRouterState(tree, children).t.h).toBe(16);
});

test("drops the pre-16.4 isRootLayout boolean that shares the prefetch hints index", () => {
  const tree = ["", {}, null, null, true] as unknown as FlightRouterState;

  expect(createTransportDataFromFlightRouterState(tree, children).t).not.toHaveProperty("h");
});

test("renders an empty node for null children, because Next 16.4 reads a null node as a skipped segment", () => {
  const tree = ["", { children: ["__PAGE__", {}] }] as FlightRouterState;

  const { t } = createTransportDataFromFlightRouterState(tree, null);

  expect(isValidElement(t.d.r)).toBe(true);
  expect(isValidElement(t.c?.get("children")?.d.r)).toBe(true);
});
