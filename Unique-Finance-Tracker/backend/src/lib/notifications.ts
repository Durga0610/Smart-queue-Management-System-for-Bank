import nodemailer from "nodemailer";
import twilio from "twilio";

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Configure Twilio client (lazy load to avoid crashing if env vars are missing)
let twilioClient: twilio.Twilio | null = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
} catch (error) {
  console.error("Failed to initialize Twilio client:", error);
}

/**
 * Send an email using the configured SMTP server
 */
export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  try {
    const info = await transporter.sendMail({
      from: `"QueueLess System" <${process.env.SMTP_USER || "noreply@queueless.com"}>`,
      to,
      subject,
      text,
      html: html || text,
    });
    
    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Make a phone call using Twilio
 */
export async function makeCall(to: string, message: string) {
  if (!twilioClient) {
    return { success: false, error: "Twilio client not initialized. Check your environment variables." };
  }
  
  if (!process.env.TWILIO_PHONE_NUMBER) {
    return { success: false, error: "Twilio phone number is not configured." };
  }

  try {
    // We use TwiML to say a message when the user answers
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(message);
    
    const call = await twilioClient.calls.create({
      twiml: twiml.toString(),
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    
    console.log("Call initiated: %s", call.sid);
    return { success: true, callSid: call.sid };
  } catch (error) {
    console.error("Error making call:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Send an SMS message using Twilio
 */
export async function sendSMS(to: string, message: string) {
  if (!twilioClient) {
    return { success: false, error: "Twilio client not initialized. Check your environment variables." };
  }
  
  if (!process.env.TWILIO_PHONE_NUMBER) {
    return { success: false, error: "Twilio phone number is not configured." };
  }

  try {
    const response = await twilioClient.messages.create({
      body: message,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    
    console.log("SMS sent: %s", response.sid);
    return { success: true, smsSid: response.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
