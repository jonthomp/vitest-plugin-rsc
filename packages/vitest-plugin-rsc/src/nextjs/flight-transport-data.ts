import type {
  DynamicParamTypesShort,
  FlightRouterState,
} from "next/dist/shared/lib/app-router-types";
import { createElement, Fragment, type ReactNode } from "react";

// Next 16.4 replaced the `f` FlightData paths (router state + seed data tuples)
// in every RSC payload with a single `t` transport tree, where each node carries
// its segment identity and its render output:
// https://github.com/vercel/next.js/blob/d7a8d015cef21ed6fdda8a009bd0bb17135f8628/packages/next/src/shared/lib/rsc-transport.ts#L1-L15
//
// The types are declared locally because `rsc-transport` only ships with Next
// 16.4+, while this package type checks against one installed Next version.
type TransportSegment =
  | string
  | { n: string; t: DynamicParamTypesShort; k: string | null; s: readonly string[] | null };

type TransportSegmentData = {
  r: ReactNode;
  p: boolean;
  v: null;
};

type TransportNode = {
  s: TransportSegment;
  h?: number;
  d: TransportSegmentData;
  c?: Map<string, TransportNode>;
};

export type TransportData = {
  t: TransportNode;
  h: TransportSegmentData;
};

// Version split: Next 16.4 reads the `t` transport tree, earlier versions read
// the `f` FlightData paths. Payloads carry both; each Next version ignores the
// field it does not know.
export type WithTransportData<Payload> = Payload & { t?: TransportData };

export function createTransportDataFromFlightRouterState(
  tree: FlightRouterState,
  children: ReactNode,
): TransportData {
  // Begin copy: Next.js FullTransportData shape
  // Source: https://github.com/vercel/next.js/blob/d7a8d015cef21ed6fdda8a009bd0bb17135f8628/packages/next/src/shared/lib/rsc-transport.ts#L191-L199
  // Adaptation: component tests do not render Next's metadata/viewport head.
  return {
    t: createTransportNodeFromFlightRouterState(tree, createRenderedSegmentNode(children)),
    h: { r: null, p: false, v: null },
  };
  // End copy
}

function createTransportNodeFromFlightRouterState(
  tree: FlightRouterState,
  rsc: ReactNode,
): TransportNode {
  // Begin copy: Next.js FullTransportNode shape
  // Source: https://github.com/vercel/next.js/blob/d7a8d015cef21ed6fdda8a009bd0bb17135f8628/packages/next/src/shared/lib/rsc-transport.ts#L120-L148
  // Adaptation: component tests already provide the rendered RSC node, so the
  // same node is used at each segment the App Router can request. This mirrors
  // createSeedDataFromFlightRouterState for the pre-16.4 payload shape.
  const [segment, parallelRoutes] = tree;
  const node: TransportNode = {
    s: segmentToTransportSegment(segment),
    d: { r: rsc, p: false, v: null },
  };

  // Version split: index 4 is the `prefetchHints` bitmask on Next 16.4+, and an
  // `isRootLayout` boolean on earlier versions, which never read this tree.
  const prefetchHints: unknown = tree[4];
  if (typeof prefetchHints === "number" && prefetchHints !== 0) {
    node.h = prefetchHints;
  }

  const parallelRouteEntries = Object.entries(parallelRoutes);
  if (parallelRouteEntries.length > 0) {
    node.c = new Map(
      parallelRouteEntries.map(([parallelRouteKey, childTree]) => [
        parallelRouteKey,
        createTransportNodeFromFlightRouterState(childTree, rsc),
      ]),
    );
  }
  // End copy
  return node;
}

function createRenderedSegmentNode(children: ReactNode): ReactNode {
  // Next 16.4 reads a null `r` as "segment skipped, keep what the client has":
  // https://github.com/vercel/next.js/blob/d7a8d015cef21ed6fdda8a009bd0bb17135f8628/packages/next/src/shared/lib/rsc-transport.ts#L52-L65
  // A test that renders nothing still rendered, so give it a non-null node.
  return children ?? createElement(Fragment);
}

function segmentToTransportSegment(segment: FlightRouterState[0]): TransportSegment {
  // Begin copy: Next.js segmentToTransportSegment
  // Source: https://github.com/vercel/next.js/blob/d7a8d015cef21ed6fdda8a009bd0bb17135f8628/packages/next/src/shared/lib/rsc-transport.ts#L264-L274
  // Adaptation: Next 16.0.x segment tuples have no static siblings entry.
  if (typeof segment === "string") return segment;

  return {
    n: segment[0],
    t: segment[2],
    k: segment[1],
    s: segment[3] ?? null,
  };
  // End copy
}
