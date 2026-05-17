import { Router, type IRouter } from "express";
import { db, branchesTable, bookingsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { computeBranchPulse } from "../lib/queue";
import { hydrateBooking } from "./bookings";

const router: IRouter = Router();

router.get("/branches", async (_req, res): Promise<void> => {
  const all = await db.select().from(branchesTable);
  const pulses = await Promise.all(all.map((b) => computeBranchPulse(b.id)));
  res.json(pulses.filter((p): p is NonNullable<typeof p> => p !== null));
});

router.get("/branches/:branchId", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.branchId), 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid branchId" });
    return;
  }
  const pulse = await computeBranchPulse(id);
  if (!pulse) {
    res.status(404).json({ error: "Branch not found" });
    return;
  }
  res.json(pulse);
});

router.get("/branches/:branchId/lounge", async (req, res): Promise<void> => {
  const branchId = parseInt(String(req.params.branchId), 10);
  const today = new Date().toISOString().slice(0, 10);
  const branch = await computeBranchPulse(branchId);
  if (!branch) {
    res.status(404).json({ error: "Branch not found" });
    return;
  }
  
  const all = await db.select().from(bookingsTable).where(and(eq(bookingsTable.branchId, branchId), eq(bookingsTable.bookingDate, today)));
  const prio = (p: string) => (p && p !== "normal" ? 0 : 1);
  const sorted = all.sort((a, b) => prio(a.priority) - prio(b.priority) || a.timeSlot.localeCompare(b.timeSlot) || a.id - b.id);
  
  const nowServing = await Promise.all(sorted.filter((b) => b.status === "serving").map(hydrateBooking));
  const upcoming = await Promise.all(sorted.filter((b) => b.status === "waiting" || b.status === "booked").slice(0, 8).map(hydrateBooking));
  
  res.json({ branch, nowServing, upcoming });
});

export default router;
