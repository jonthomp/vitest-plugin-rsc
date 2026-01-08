import { SELF } from "cloudflare:test";
import { expect, test } from "vitest";

test("sets common security headers", async () => {
  const res = await SELF.fetch("http://example.com/");

  expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  expect(res.headers.get("referrer-policy")).toBe("no-referrer");
  expect(res.headers.get("permissions-policy")).toBe(
    "geolocation=(), microphone=(), camera=()",
  );

  const csp = res.headers.get("content-security-policy");
  expect(csp).toBeTruthy();
  expect(csp!).toContain("default-src 'self'");
  expect(csp!).toContain("nonce-");
});

