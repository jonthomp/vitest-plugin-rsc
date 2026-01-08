import { SELF } from "cloudflare:test";
import { expect, test } from "vitest";

test("serves public assets via assets binding", async () => {
  const res = await SELF.fetch("http://example.com/favicon-light.svg");
  expect(res.status).toBe(200);

  const contentType = res.headers.get("content-type") ?? "";
  expect(contentType).toContain("image/svg+xml");

  const body = await res.text();
  expect(body).toContain("<svg");
});

