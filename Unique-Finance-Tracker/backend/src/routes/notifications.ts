import { Router, Request, Response } from "express";
import { z } from "zod";
import { sendEmail, makeCall } from "../lib/notifications.js";

const router = Router();

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().min(1),
  html: z.string().optional(),
});

const callSchema = z.object({
  to: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Must be a valid E.164 phone number"),
  message: z.string().min(1),
});

/**
 * POST /api/notifications/email
 * Send an email notification
 */
router.post("/email", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = emailSchema.safeParse(req.body);
    
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
      return;
    }
    
    const result = await sendEmail(parsed.data.to, parsed.data.subject, parsed.data.text, parsed.data.html);
    
    if (!result.success) {
      res.status(500).json({ error: "Failed to send email", details: result.error });
      return;
    }
    
    res.status(200).json({ message: "Email sent successfully", messageId: result.messageId });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/notifications/call
 * Initiate a phone call notification
 */
router.post("/call", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = callSchema.safeParse(req.body);
    
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
      return;
    }
    
    const result = await makeCall(parsed.data.to, parsed.data.message);
    
    if (!result.success) {
      res.status(500).json({ error: "Failed to initiate call", details: result.error });
      return;
    }
    
    res.status(200).json({ message: "Call initiated successfully", callSid: result.callSid });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
