import { describe, it, expect } from "vitest";
import { renderSms } from "@/lib/sms-templates";

describe("renderSms", () => {
  const ctx = {
    name: "Aling Maria",
    ticketNumber: "A-042",
    statusUrl: "https://clinic.test/q/A-042",
    estimatedWaitMinutes: 45,
  };

  it("renders the check-in confirmation in English", () => {
    expect(renderSms("checkin", ctx)).toBe(
      "Hi Aling Maria, you're ticket A-042. Estimated wait: 45 min. Track status: https://clinic.test/q/A-042"
    );
  });

  it("renders the 2-slots-away message", () => {
    expect(renderSms("almost", ctx)).toBe(
      "Ticket A-042 — please return to the clinic. You will be called soon."
    );
  });

  it("renders the your-turn message", () => {
    expect(renderSms("your-turn", ctx)).toBe(
      "Ticket A-042 — please proceed to consultation now."
    );
  });
});
