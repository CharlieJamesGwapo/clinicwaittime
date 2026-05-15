import { describe, it, expect } from "vitest";
import { formatTicketNumber } from "@/lib/ticket-number";

describe("formatTicketNumber", () => {
  it("formats sequence 1 as A-001", () => {
    expect(formatTicketNumber(1)).toBe("A-001");
  });

  it("formats sequence 42 as A-042", () => {
    expect(formatTicketNumber(42)).toBe("A-042");
  });

  it("formats sequence 999 as A-999", () => {
    expect(formatTicketNumber(999)).toBe("A-999");
  });

  it("rolls over to B-001 at sequence 1000", () => {
    expect(formatTicketNumber(1000)).toBe("B-001");
  });
});
