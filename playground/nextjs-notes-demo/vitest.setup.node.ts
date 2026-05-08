import { vi, beforeEach } from "vitest";
import { deleteFlashCookies } from "#lib/flash-cookie.ts";

vi.mock("#lib/flash-cookie.ts");

beforeEach(() => {
  deleteFlashCookies();
});
