import { SELF } from "cloudflare:test";
import { expect, test } from "vitest";

test("requestInfo is available during request handling", async () => {
  const res = await SELF.fetch("http://example.com/__test/request-info");
  expect(res.status).toBe(200);

  const body = await res.json<{
    url?: string;
    method?: string;
    cf?: unknown;
  }>();

  expect(body.method).toBe("GET");
  expect(body.url).toContain("/__test/request-info");
  // In workerd this should be present (at least as an object).
  expect(body.cf).toBeTruthy();
});

