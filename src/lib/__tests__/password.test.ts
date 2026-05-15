import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password helpers", () => {
  it("hashPassword returns a bcrypt hash that is not the plaintext", async () => {
    const hash = await hashPassword("nurse123");
    expect(hash).not.toBe("nurse123");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("verifyPassword returns true for the correct password", async () => {
    const hash = await hashPassword("nurse123");
    await expect(verifyPassword("nurse123", hash)).resolves.toBe(true);
  });

  it("verifyPassword returns false for the wrong password", async () => {
    const hash = await hashPassword("nurse123");
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });
});
