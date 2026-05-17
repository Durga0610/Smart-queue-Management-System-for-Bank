import { Router, type IRouter, type Request } from "express";
import { db, bookingsTable, branchesTable, servicesTable, checklistItemsTable, usersTable } from "@workspace/db";
import { and, eq, sql, desc } from "drizzle-orm";
import { CreateBookingBody, UpdateBookingChecklistBody } from "@workspace/api-zod";
import { requireUser } from "../lib/auth";
import { generateTimeSlots, makeTokenNumber, computeBranchPulse } from "../lib/queue";
import { sendEmail, sendSMS } from "../lib/notifications.js";

const router: IRouter = Router();

type ReqWithUser = Request & { user: typeof usersTable.$inferSelect };

async function hydrate(b: typeof bookingsTable.$inferSelect) {
  const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, b.branchId)).limit(1);
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, b.serviceId)).limit(1);
  const checklist = await db.select().from(checklistItemsTable).where(eq(checklistItemsTable.serviceId, b.serviceId));
  let done: string[] = [];
  try { done = JSON.parse(b.checklistDone) as string[]; } catch { done = []; }
  return {
    id: b.id,
    userId: b.userId,
    branchId: b.branchId,
    branchName: branch?.name ?? "",
    serviceId: b.serviceId,
    serviceName: service?.name ?? "",
    bookingDate: b.bookingDate,
    timeSlot: b.timeSlot,
    tokenNumber: b.tokenNumber,
    status: b.status,
    groupSize: b.groupSize,
    priority: b.priority,
    checklistCompleted: done.length,
    checklistTotal: checklist.length,
    completedItems: done,
    createdAt: (b.createdAt instanceof Date && !isNaN(b.createdAt.getTime())) ? b.createdAt.toISOString() : new Date().toISOString(),
  };
}

router.get("/smart-slots", async (req, res): Promise<void> => {
  const branchId = parseInt(String(req.query.branchId), 10);
  const serviceId = parseInt(String(req.query.serviceId), 10);
  const date = String(req.query.date ?? "");
  if (!Number.isFinite(branchId) || !Number.isFinite(serviceId) || !date) {
    res.status(400).json({ error: "branchId, serviceId, date required" });
    return;
  }
  const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, branchId)).limit(1);
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId)).limit(1);
  if (!branch || !service) {
    res.status(404).json({ error: "Branch or service not found" });
    return;
  }
  const existing = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.branchId, branchId), eq(bookingsTable.bookingDate, date)));

  const slots = generateTimeSlots();
  const counters = Math.max(1, branch.openCounters);
  const slotLoad = new Map<string, number>();
  for (const b of existing) {
    if (b.status === "cancelled" || b.status === "no_show") continue;
    slotLoad.set(b.timeSlot, (slotLoad.get(b.timeSlot) ?? 0) + 1);
  }

  const ranked = slots.map((slot) => {
    const load = slotLoad.get(slot) ?? 0;
    const expectedWait = Math.round((load / counters) * service.avgDurationMinutes);
    const score = 100 - Math.min(100, expectedWait * 4 + load * 2);
    let label = "Open";
    if (load === 0) label = "Wide open";
    else if (load <= counters) label = "Quick in/out";
    else if (load <= counters * 2) label = "Moderate";
    else label = "Busy";
    return { timeSlot: slot, expectedWaitMinutes: expectedWait, score, label, recommended: false };
  });

  ranked.sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 6).map((s, i) => ({ ...s, recommended: i === 0 }));
  // sort top by chronological for nicer UI
  const slotIndex = new Map(slots.map((s, i) => [s, i] as const));
  top.sort((a, b) => (slotIndex.get(a.timeSlot)! - slotIndex.get(b.timeSlot)!));
  res.json(top);
});

router.get("/bookings", requireUser, async (req, res): Promise<void> => {
  const user = (req as ReqWithUser).user;
  const rows = await db.select().from(bookingsTable).where(eq(bookingsTable.userId, user.id)).orderBy(desc(bookingsTable.createdAt));
  const out = await Promise.all(rows.map(hydrate));
  res.json(out);
});

router.post("/bookings", requireUser, async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = (req as ReqWithUser).user;
  const { branchId, serviceId, bookingDate, timeSlot, groupSize, priority } = parsed.data;
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId)).limit(1);
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.branchId, branchId), eq(bookingsTable.serviceId, serviceId), eq(bookingsTable.bookingDate, bookingDate)));
  const tokenNumber = makeTokenNumber(service.code, count + 1);
  try {
    const [b] = await db.insert(bookingsTable).values({
      userId: user.id,
      branchId,
      serviceId,
      bookingDate,
      timeSlot,
      tokenNumber,
      status: "waiting",
      groupSize: groupSize ?? 1,
      priority: priority ?? "normal",
    }).returning();
    if (!b) {
      res.status(500).json({ error: "Could not create booking" });
      return;
    }
    const hydrated = await hydrate(b);
    
    // Send confirmation email asynchronously
    console.log(`[NOTIFY] Attempting to send booking email to: ${user.email}`);
    sendEmail(
      user.email,
      `OFFICIAL: Booking Confirmation - ${hydrated.tokenNumber}`,
      `Dear ${user.name},\n\nYour appointment at QueueLess Pulse has been successfully scheduled.\n\nAPPOINTMENT DETAILS:\nToken ID: ${hydrated.tokenNumber}\nService: ${hydrated.serviceName}\nBranch: ${hydrated.branchName}\nDate: ${hydrated.bookingDate}\nTime: ${hydrated.timeSlot}\n\nThis is an autogenerated message. Please do not reply to this email.`,
      `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; color: #1a202c; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0d9488; margin: 0; font-size: 24px; letter-spacing: -0.025em;">QueueLess Pulse</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Smart Banking Appointment Confirmation</p>
        </div>
        
        <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <span style="font-size: 14px; color: #115e59; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your Token Number</span>
          <div style="font-size: 48px; font-weight: 800; color: #0d9488; margin: 10px 0;">${hydrated.tokenNumber}</div>
          <p style="font-size: 14px; color: #115e59; margin: 0;">Please present this token at the branch.</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${user.name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; color: #475569;">Your appointment has been successfully scheduled. Below are your formal booking details:</p>
        
        <table style="width: 100%; margin-top: 20px; border-collapse: separate; border-spacing: 0;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px; width: 40%;">Service Requested</td>
            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${hydrated.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Branch Location</td>
            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${hydrated.branchName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Appointment Date</td>
            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${hydrated.bookingDate}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;">Allocated Time Slot</td>
            <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${hydrated.timeSlot}</td>
          </tr>
        </table>

        <div style="margin-top: 32px; padding: 16px; background-color: #f8fafc; border-radius: 8px; font-size: 13px; color: #64748b; line-height: 1.5;">
          <strong>Important Instructions:</strong>
          <ul style="margin: 8px 0 0 20px; padding: 0;">
            <li>Please arrive 5 minutes before your scheduled time slot.</li>
            <li>Keep this digital confirmation ready for check-in.</li>
            <li>If you need to cancel, please do so via the QueueLess app.</li>
          </ul>
        </div>

        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            This is an autogenerated official notification from QueueLess Pulse Banking Systems.<br>
            <strong>PLEASE DO NOT REPLY TO THIS EMAIL.</strong>
          </p>
          <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px;">
            &copy; 2026 QueueLess Pulse. All rights reserved.
          </p>
        </div>
      </div>
      `
    ).catch(err => req.log.error({ err }, "Failed to send confirmation email"));
    
    // Send SMS confirmation if phone number is available
    if (user.phoneNumber) {
      console.log(`[NOTIFY] Attempting to send booking SMS to: ${user.phoneNumber}`);
      sendSMS(
        user.phoneNumber,
        `OFFICIAL: Your QueueLess Token is ${hydrated.tokenNumber}. Branch: ${hydrated.branchName}, Service: ${hydrated.serviceName}, Time: ${hydrated.timeSlot}. Please arrive 5 mins early. This is an autogenerated msg.`
      ).catch(err => req.log.error({ err }, "Failed to send SMS confirmation"));
    } else {
      console.log("[NOTIFY] No phone number found for user, skipping SMS.");
    }

    res.json(hydrated);
  } catch (err) {
    req.log.error({ err }, "Booking creation failed");
    res.status(500).json({ error: "Booking creation failed", details: String(err) });
  }
});

router.get("/bookings/:bookingId", requireUser, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.bookingId), 10);
  const [b] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!b) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(await hydrate(b));
});

router.delete("/bookings/:bookingId", requireUser, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.bookingId), 10);
  const user = (req as ReqWithUser).user;
  const [b] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!b || b.userId !== user.id) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.update(bookingsTable).set({ status: "cancelled" }).where(eq(bookingsTable.id, id));
  res.json({ ok: true });
});

router.patch("/bookings/:bookingId/checklist", requireUser, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.bookingId), 10);
  const parsed = UpdateBookingChecklistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = (req as ReqWithUser).user;
  const [b] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!b || b.userId !== user.id) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.update(bookingsTable).set({ checklistDone: JSON.stringify(parsed.data.completedItems) }).where(eq(bookingsTable.id, id));
  const [updated] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  res.json(await hydrate(updated!));
});

export default router;
export { hydrate as hydrateBooking };
