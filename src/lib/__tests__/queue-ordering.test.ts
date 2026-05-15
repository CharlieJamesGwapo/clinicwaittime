import { describe, it, expect } from "vitest";
import { orderQueue, type QueueTicket } from "@/lib/queue-ordering";

const t = (
  number: string,
  status: QueueTicket["status"],
  priorityType: QueueTicket["priorityType"],
  createdAt: string,
): QueueTicket => ({ number, status, priorityType, createdAt: new Date(createdAt) });

describe("orderQueue", () => {
  it("returns empty for empty input", () => {
    expect(orderQueue([])).toEqual([]);
  });

  it("puts SERVING before any WAITING", () => {
    const tickets = [
      t("A-001", "WAITING", "PWD", "2026-05-15T10:00:00Z"),
      t("A-002", "SERVING", "NONE", "2026-05-15T10:30:00Z"),
    ];
    expect(orderQueue(tickets).map((x) => x.number)).toEqual(["A-002", "A-001"]);
  });

  it("puts CALLED before WAITING", () => {
    const tickets = [
      t("A-001", "WAITING", "PWD", "2026-05-15T10:00:00Z"),
      t("A-002", "CALLED", "NONE", "2026-05-15T10:30:00Z"),
    ];
    expect(orderQueue(tickets).map((x) => x.number)).toEqual(["A-002", "A-001"]);
  });

  it("within the same 15-min window, priority comes before NONE", () => {
    const tickets = [
      t("A-001", "WAITING", "NONE", "2026-05-15T10:01:00Z"),
      t("A-002", "WAITING", "SENIOR", "2026-05-15T10:10:00Z"),
    ];
    expect(orderQueue(tickets).map((x) => x.number)).toEqual(["A-002", "A-001"]);
  });

  it("across different 15-min windows, earlier window wins regardless of priority", () => {
    const tickets = [
      t("A-001", "WAITING", "NONE", "2026-05-15T10:00:00Z"),
      t("A-002", "WAITING", "SENIOR", "2026-05-15T10:20:00Z"),
    ];
    expect(orderQueue(tickets).map((x) => x.number)).toEqual(["A-001", "A-002"]);
  });

  it("within the same priority class, sorts by createdAt ascending", () => {
    const tickets = [
      t("A-002", "WAITING", "NONE", "2026-05-15T10:05:00Z"),
      t("A-001", "WAITING", "NONE", "2026-05-15T10:01:00Z"),
      t("A-003", "WAITING", "NONE", "2026-05-15T10:10:00Z"),
    ];
    expect(orderQueue(tickets).map((x) => x.number)).toEqual(["A-001", "A-002", "A-003"]);
  });

  it("PWD, SENIOR, PREGNANT all count as priority", () => {
    const tickets = [
      t("A-001", "WAITING", "NONE", "2026-05-15T10:01:00Z"),
      t("A-002", "WAITING", "PWD", "2026-05-15T10:02:00Z"),
      t("A-003", "WAITING", "SENIOR", "2026-05-15T10:03:00Z"),
      t("A-004", "WAITING", "PREGNANT", "2026-05-15T10:04:00Z"),
    ];
    const ordered = orderQueue(tickets).map((x) => x.number);
    expect(ordered.slice(0, 3)).toEqual(["A-002", "A-003", "A-004"]);
    expect(ordered[3]).toBe("A-001");
  });

  it("filters out DONE / SKIPPED / DROPOUT", () => {
    const tickets = [
      t("A-001", "WAITING", "NONE", "2026-05-15T10:01:00Z"),
      t("A-002", "DONE", "NONE", "2026-05-15T09:50:00Z"),
      t("A-003", "SKIPPED", "NONE", "2026-05-15T09:55:00Z"),
      t("A-004", "DROPOUT", "NONE", "2026-05-15T09:58:00Z"),
    ];
    expect(orderQueue(tickets).map((x) => x.number)).toEqual(["A-001"]);
  });
});
