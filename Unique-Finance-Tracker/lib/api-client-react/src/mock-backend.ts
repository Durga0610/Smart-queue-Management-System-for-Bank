// Mock Backend for GitHub Pages Standalone / Demo Mode
import { CustomFetchOptions } from "./custom-fetch";

// Interfaces mirroring the database and backend models
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  karma: number;
  phoneNumber?: string;
}

interface Branch {
  id: number;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  openCounters: number;
}

interface Service {
  id: number;
  name: string;
  code: string;
  avgDurationMinutes: number;
  icon: string;
  description: string;
}

interface ChecklistItem {
  serviceId: number;
  key: string;
  label: string;
  required: boolean;
  hint: string;
}

interface Booking {
  id: number;
  userId: number;
  branchId: number;
  branchName: string;
  serviceId: number;
  serviceName: string;
  bookingDate: string;
  timeSlot: string;
  tokenNumber: string;
  status: "booked" | "waiting" | "serving" | "completed" | "cancelled" | "no_show";
  groupSize: number;
  priority: "normal" | "priority" | "vip";
  checklistCompleted: number;
  checklistTotal: number;
  completedItems: string[];
  createdAt: string;
  servedAt?: string;
}

interface SwapListing {
  id: number;
  bookingId: number;
  ownerId: number;
  ownerName: string;
  note: string;
  status: "open" | "accepted" | "cancelled";
  createdAt: string;
  tokenNumber: string;
  serviceName: string;
  branchName: string;
  timeSlot: string;
  bookingDate: string;
  branchId: number;
}

// ---------------------------------------------------------------------------
// STATIC SEED DATA
// ---------------------------------------------------------------------------
const staticBranches: Branch[] = [
  { id: 1, name: "Downtown Flagship", address: "44 Market St", city: "San Francisco", lat: 37.7898, lng: -122.4014, openCounters: 5 },
  { id: 2, name: "Mission District", address: "2200 Mission St", city: "San Francisco", lat: 37.7615, lng: -122.4189, openCounters: 3 },
  { id: 3, name: "Hayes Valley", address: "401 Hayes St", city: "San Francisco", lat: 37.7766, lng: -122.4244, openCounters: 2 },
  { id: 4, name: "SoMa Tech Hub", address: "680 Folsom St", city: "San Francisco", lat: 37.7847, lng: -122.3989, openCounters: 4 },
  { id: 5, name: "Berkeley Shattuck", address: "2100 Shattuck Ave", city: "Berkeley", lat: 37.8716, lng: -122.2683, openCounters: 3 },
];

const staticServices: Service[] = [
  { id: 1, name: "Cash Deposit", code: "CD", avgDurationMinutes: 4, icon: "Banknote", description: "Deposit cash into your account" },
  { id: 2, name: "Cash Withdrawal", code: "CW", avgDurationMinutes: 5, icon: "HandCoins", description: "Withdraw cash from your account" },
  { id: 3, name: "Account Opening", code: "AO", avgDurationMinutes: 18, icon: "UserPlus", description: "Open a new personal or business account" },
  { id: 4, name: "Loan Enquiry", code: "LE", avgDurationMinutes: 22, icon: "FileText", description: "Speak with a loan officer about home, auto, or personal loans" },
  { id: 5, name: "Card Services", code: "CS", avgDurationMinutes: 9, icon: "CreditCard", description: "Replace, activate, or upgrade your debit/credit card" },
  { id: 6, name: "Wire Transfer", code: "WT", avgDurationMinutes: 12, icon: "ArrowRightLeft", description: "Send a domestic or international wire" },
];

const staticChecklistItems: ChecklistItem[] = [
  { serviceId: 1, key: "cash", label: "Cash to deposit", required: true, hint: "Counted and bundled if possible" },
  { serviceId: 1, key: "id", label: "Government-issued ID", required: true, hint: "Driver's license or passport" },
  { serviceId: 1, key: "passbook", label: "Account number or passbook", required: false, hint: "Speeds things up" },

  { serviceId: 2, key: "id", label: "Government-issued ID", required: true, hint: "" },
  { serviceId: 2, key: "card", label: "Debit card", required: false, hint: "" },
  { serviceId: 2, key: "slip", label: "Withdrawal slip", required: false, hint: "Available at the counter" },

  { serviceId: 3, key: "id", label: "Government-issued photo ID", required: true, hint: "" },
  { serviceId: 3, key: "ssn", label: "SSN or Tax ID", required: true, hint: "" },
  { serviceId: 3, key: "address", label: "Proof of address", required: true, hint: "Utility bill, lease, or bank statement" },
  { serviceId: 3, key: "deposit", label: "Initial deposit", required: false, hint: "Cash or check" },

  { serviceId: 4, key: "id", label: "Government-issued ID", required: true, hint: "" },
  { serviceId: 4, key: "income", label: "Recent pay stubs or income proof", required: true, hint: "Last 2 months" },
  { serviceId: 4, key: "statements", label: "Bank statements", required: false, hint: "Last 3 months" },

  { serviceId: 5, key: "id", label: "Government-issued ID", required: true, hint: "" },
  { serviceId: 5, key: "old_card", label: "Old card (if replacing)", required: false, hint: "" },

  { serviceId: 6, key: "id", label: "Government-issued ID", required: true, hint: "" },
  { serviceId: 6, key: "recipient", label: "Recipient bank details", required: true, hint: "Name, account, routing/SWIFT" },
  { serviceId: 6, key: "purpose", label: "Purpose of transfer", required: true, hint: "" },
];

// Helper to initialize and retrieve LocalStorage Database
function getDB<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  const raw = localStorage.getItem(`queueless_db_${key}`);
  if (!raw) {
    localStorage.setItem(`queueless_db_${key}`, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

function setDB<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`queueless_db_${key}`, JSON.stringify(val));
}

// ---------------------------------------------------------------------------
// DB Initialization & Seeding
// ---------------------------------------------------------------------------
function initDB() {
  const users = getDB<User[]>("users", [
    { id: 1, name: "Demo Customer", email: "demo@queueless.app", role: "customer", karma: 78, phoneNumber: "+15551234567" },
    { id: 2, name: "Aisha Rahman", email: "aisha@queueless.app", role: "customer", karma: 92 },
    { id: 3, name: "Branch Manager", email: "staff@queueless.app", role: "staff", karma: 100 },
  ]);

  const currentUser = getDB<User | null>("current_user", users[0]); // Default to first user for easy sandbox testing

  const today = new Date().toISOString().slice(0, 10);
  getDB<Booking[]>("bookings", [
    { id: 1, userId: 2, branchId: 1, branchName: "Downtown Flagship", serviceId: 1, serviceName: "Cash Deposit", bookingDate: today, timeSlot: "10:00 AM", tokenNumber: "CD-101", status: "completed", groupSize: 1, priority: "normal", checklistCompleted: 2, checklistTotal: 3, completedItems: ["cash", "id"], createdAt: new Date().toISOString() },
    { id: 2, userId: 2, branchId: 1, branchName: "Downtown Flagship", serviceId: 2, serviceName: "Cash Withdrawal", bookingDate: today, timeSlot: "10:15 AM", tokenNumber: "CW-102", status: "completed", groupSize: 1, priority: "normal", checklistCompleted: 1, checklistTotal: 3, completedItems: ["id"], createdAt: new Date().toISOString() },
    { id: 3, userId: 2, branchId: 1, branchName: "Downtown Flagship", serviceId: 3, serviceName: "Account Opening", bookingDate: today, timeSlot: "10:30 AM", tokenNumber: "AO-103", status: "serving", groupSize: 1, priority: "normal", checklistCompleted: 3, checklistTotal: 4, completedItems: ["id", "ssn", "address"], createdAt: new Date().toISOString() },
    { id: 4, userId: 1, branchId: 1, branchName: "Downtown Flagship", serviceId: 1, serviceName: "Cash Deposit", bookingDate: today, timeSlot: "10:45 AM", tokenNumber: "CD-104", status: "waiting", groupSize: 1, priority: "normal", checklistCompleted: 0, checklistTotal: 3, completedItems: [], createdAt: new Date().toISOString() },
    { id: 5, userId: 2, branchId: 1, branchName: "Downtown Flagship", serviceId: 4, serviceName: "Loan Enquiry", bookingDate: today, timeSlot: "11:00 AM", tokenNumber: "LE-105", status: "waiting", groupSize: 1, priority: "normal", checklistCompleted: 0, checklistTotal: 3, completedItems: [], createdAt: new Date().toISOString() },
  ]);

  getDB<SwapListing[]>("swaps", [
    { id: 1, bookingId: 5, ownerId: 2, ownerName: "Aisha Rahman", note: "Need to go later due to transit delay", status: "open", createdAt: new Date().toISOString(), tokenNumber: "LE-105", serviceName: "Loan Enquiry", branchName: "Downtown Flagship", timeSlot: "11:00 AM", bookingDate: today, branchId: 1 },
  ]);
}

// Ensure database is populated
initDB();

// ---------------------------------------------------------------------------
// MOCK FETCH ROUTER
// ---------------------------------------------------------------------------
export async function mockFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {}
): Promise<T> {
  const urlStr = typeof input === "string" ? input : "url" in input ? input.url : String(input);
  const method = (options.method ?? "GET").toUpperCase();
  const body = options.body ? JSON.parse(String(options.body)) : null;

  // Extract endpoint relative path
  const urlObj = new URL(urlStr, window.location.origin);
  const path = urlObj.pathname;

  const query: Record<string, string> = {};
  urlObj.searchParams.forEach((val, key) => {
    query[key] = val;
  });
  console.log(`[Mock API Interceptor] ${method} -> ${path}`, { query, body });

  // Simulate server latency
  await new Promise((resolve) => setTimeout(resolve, 200));

  // --- 1. SESSION / AUTHENTICATION ENDPOINTS ---
  if (path === "/api/session/me" && method === "GET") {
    const user = getDB<User | null>("current_user", null);
    if (!user) {
      throw new Error("Unauthorized");
    }
    return user as unknown as T;
  }

  if (path === "/api/session/register" && method === "POST") {
    const users = getDB<User[]>("users", []);
    const newUser: User = {
      id: users.length + 1,
      name: body.name,
      email: body.email,
      role: "customer",
      karma: 50,
      phoneNumber: body.phoneNumber || undefined,
    };
    users.push(newUser);
    setDB("users", users);
    setDB("current_user", newUser);
    return newUser as unknown as T;
  }

  if (path === "/api/session/login" && method === "POST") {
    const users = getDB<User[]>("users", []);
    const matched = users.find((u) => u.email === body.email);
    if (!matched) {
      throw new Error("Invalid email or password");
    }
    setDB("current_user", matched);
    return matched as unknown as T;
  }

  if (path === "/api/session/logout" && method === "POST") {
    setDB<User | null>("current_user", null);
    return { ok: true } as unknown as T;
  }

  // --- 2. BRANCHES ENDPOINTS ---
  if (path === "/api/branches" && method === "GET") {
    const bookings = getDB<Booking[]>("bookings", []);
    const today = new Date().toISOString().slice(0, 10);

    const hydratedBranches = staticBranches.map((br) => {
      const active = bookings.filter(
        (b) => b.branchId === br.id && b.bookingDate === today && (b.status === "waiting" || b.status === "serving")
      );
      const waiting = active.filter((b) => b.status === "waiting").length;
      const avgWait = waiting * 8; // Estimate 8 minutes wait per ticket

      let status: "Green" | "Yellow" | "Red" = "Green";
      if (waiting > br.openCounters * 2) status = "Red";
      else if (waiting > br.openCounters) status = "Yellow";

      return {
        ...br,
        waitingCount: waiting,
        servingCount: active.length - waiting,
        avgWaitMinutes: avgWait,
        status,
      };
    });
    return hydratedBranches as unknown as T;
  }

  if (path.startsWith("/api/branches/") && method === "GET") {
    const id = parseInt(path.split("/").pop() || "", 10);
    const branch = staticBranches.find((b) => b.id === id);
    if (!branch) throw new Error("Branch not found");

    const bookings = getDB<Booking[]>("bookings", []);
    const today = new Date().toISOString().slice(0, 10);
    const active = bookings.filter(
      (b) => b.branchId === id && b.bookingDate === today && (b.status === "waiting" || b.status === "serving")
    );
    const waiting = active.filter((b) => b.status === "waiting").length;
    const avgWait = waiting * 8;

    let status: "Green" | "Yellow" | "Red" = "Green";
    if (waiting > branch.openCounters * 2) status = "Red";
    else if (waiting > branch.openCounters) status = "Yellow";

    return {
      ...branch,
      waitingCount: waiting,
      servingCount: active.length - waiting,
      avgWaitMinutes: avgWait,
      status,
      counters: Array.from({ length: branch.openCounters }).map((_, idx) => ({
        number: idx + 1,
        status: idx === 0 ? "busy" : "idle",
        currentTicket: idx === 0 ? "AO-103" : null,
      })),
    } as unknown as T;
  }

  // --- 3. SERVICES ENDPOINTS ---
  if (path === "/api/services" && method === "GET") {
    return staticServices as unknown as T;
  }

  if (path.startsWith("/api/services/") && path.endsWith("/checklist") && method === "GET") {
    const matches = path.match(/\/api\/services\/(\d+)\/checklist/);
    const serviceId = matches ? parseInt(matches[1]!, 10) : 0;
    const items = staticChecklistItems.filter((i) => i.serviceId === serviceId);
    return items as unknown as T;
  }

  // --- 4. SMART SLOTS GENERATION ---
  if (path === "/api/smart-slots" && method === "GET") {
    const slots = [
      "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
      "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"
    ];
    const top = slots.slice(0, 6).map((slot, idx) => ({
      timeSlot: slot,
      expectedWaitMinutes: idx * 3,
      score: 100 - idx * 10,
      label: idx === 0 ? "Wide open" : idx < 3 ? "Quick in/out" : "Moderate",
      recommended: idx === 0,
    }));
    return top as unknown as T;
  }

  // --- 5. BOOKINGS ENDPOINTS ---
  if (path === "/api/bookings" && method === "GET") {
    const user = getDB<User | null>("current_user", null);
    if (!user) throw new Error("Unauthorized");
    const bookings = getDB<Booking[]>("bookings", []);
    return bookings.filter((b) => b.userId === user.id) as unknown as T;
  }

  if (path === "/api/bookings" && method === "POST") {
    const user = getDB<User | null>("current_user", null);
    if (!user) throw new Error("Unauthorized");

    const bookings = getDB<Booking[]>("bookings", []);
    const service = staticServices.find((s) => s.id === body.serviceId);
    const branch = staticBranches.find((b) => b.id === body.branchId);

    if (!service || !branch) throw new Error("Branch or Service invalid");

    const count = bookings.filter(
      (b) => b.branchId === body.branchId && b.serviceId === body.serviceId && b.bookingDate === body.bookingDate
    ).length;

    const tokenNumber = `${service.code}-${100 + count + 1}`;
    const checklist = staticChecklistItems.filter((i) => i.serviceId === service.id);

    const newBooking: Booking = {
      id: bookings.length + 1,
      userId: user.id,
      branchId: branch.id,
      branchName: branch.name,
      serviceId: service.id,
      serviceName: service.name,
      bookingDate: body.bookingDate,
      timeSlot: body.timeSlot,
      tokenNumber,
      status: "waiting",
      groupSize: body.groupSize || 1,
      priority: body.priority || "normal",
      checklistCompleted: 0,
      checklistTotal: checklist.length,
      completedItems: [],
      createdAt: new Date().toISOString(),
    };

    bookings.unshift(newBooking); // Add new booking to top
    setDB("bookings", bookings);

    return newBooking as unknown as T;
  }

  if (path.startsWith("/api/bookings/") && method === "GET") {
    const id = parseInt(path.split("/").pop() || "", 10);
    const bookings = getDB<Booking[]>("bookings", []);
    const found = bookings.find((b) => b.id === id);
    if (!found) throw new Error("Booking not found");
    return found as unknown as T;
  }

  if (path.startsWith("/api/bookings/") && method === "DELETE") {
    const id = parseInt(path.split("/").pop() || "", 10);
    const bookings = getDB<Booking[]>("bookings", []);
    const updated = bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b));
    setDB("bookings", updated);
    return { ok: true } as unknown as T;
  }

  if (path.startsWith("/api/bookings/") && path.endsWith("/checklist") && method === "PATCH") {
    const matches = path.match(/\/api\/bookings\/(\d+)\/checklist/);
    const bookingId = matches ? parseInt(matches[1]!, 10) : 0;

    const bookings = getDB<Booking[]>("bookings", []);
    const bookingIdx = bookings.findIndex((b) => b.id === bookingId);
    if (bookingIdx === -1) throw new Error("Booking not found");

    const completed = body.completedItems as string[];
    const booking = bookings[bookingIdx]!;
    booking.completedItems = completed;
    booking.checklistCompleted = completed.length;

    setDB("bookings", bookings);
    return booking as unknown as T;
  }

  // --- 6. TICKET SWAPPING ENDPOINTS ---
  if (path === "/api/swap" && method === "GET") {
    const swaps = getDB<SwapListing[]>("swaps", []);
    return swaps.filter((s) => s.status === "open") as unknown as T;
  }

  if (path === "/api/swap" && method === "POST") {
    const user = getDB<User | null>("current_user", null);
    if (!user) throw new Error("Unauthorized");

    const bookings = getDB<Booking[]>("bookings", []);
    const booking = bookings.find((b) => b.id === body.bookingId);
    if (!booking) throw new Error("Booking not found");

    const swaps = getDB<SwapListing[]>("swaps", []);
    const newSwap: SwapListing = {
      id: swaps.length + 1,
      bookingId: booking.id,
      ownerId: user.id,
      ownerName: user.name,
      note: body.note || "",
      status: "open",
      createdAt: new Date().toISOString(),
      tokenNumber: booking.tokenNumber,
      serviceName: booking.serviceName,
      branchName: booking.branchName,
      timeSlot: booking.timeSlot,
      bookingDate: booking.bookingDate,
      branchId: booking.branchId,
    };
    swaps.unshift(newSwap);
    setDB("swaps", swaps);

    return newSwap as unknown as T;
  }

  if (path.startsWith("/api/swap/") && path.endsWith("/accept") && method === "POST") {
    const matches = path.match(/\/api\/swap\/(\d+)\/accept/);
    const swapId = matches ? parseInt(matches[1]!, 10) : 0;

    const swaps = getDB<SwapListing[]>("swaps", []);
    const swapIdx = swaps.findIndex((s) => s.id === swapId);
    if (swapIdx === -1) throw new Error("Swap not found");

    const swap = swaps[swapIdx]!;
    swap.status = "accepted";

    // Swap slots in actual bookings list
    const bookings = getDB<Booking[]>("bookings", []);
    const user = getDB<User | null>("current_user", null);
    if (!user) throw new Error("Unauthorized");

    // Find applicant's active booking for the same branch and service to swap
    const applicantBookingIdx = bookings.findIndex(
      (b) => b.userId === user.id && b.branchId === swap.branchId && b.status === "waiting"
    );

    const ownerBookingIdx = bookings.findIndex((b) => b.id === swap.bookingId);

    if (ownerBookingIdx !== -1 && applicantBookingIdx !== -1) {
      const ownerB = bookings[ownerBookingIdx]!;
      const applicantB = bookings[applicantBookingIdx]!;

      // Swap the dates, timeslots, and token numbers
      const tempSlot = ownerB.timeSlot;
      const tempDate = ownerB.bookingDate;
      const tempToken = ownerB.tokenNumber;

      ownerB.timeSlot = applicantB.timeSlot;
      ownerB.bookingDate = applicantB.bookingDate;
      ownerB.tokenNumber = applicantB.tokenNumber;

      applicantB.timeSlot = tempSlot;
      applicantB.bookingDate = tempDate;
      applicantB.tokenNumber = tempToken;

      setDB("bookings", bookings);
    } else if (ownerBookingIdx !== -1) {
      // If the applicant has no booking to swap, they simply inherit the slot and the original owner gets cancelled/moved
      const ownerB = bookings[ownerBookingIdx]!;
      ownerB.userId = user.id;
      setDB("bookings", bookings);
    }

    setDB("swaps", swaps);
    return { ok: true } as unknown as T;
  }

  // --- 7. NOTIFICATIONS & HEALTH TEST ---
  if (path === "/api/notifications/test" && method === "POST") {
    return { ok: true, status: "sent" } as unknown as T;
  }

  if (path === "/api/health" && method === "GET") {
    return { status: "healthy", database: "connected" } as unknown as T;
  }

  throw new Error(`Mock Router: Path ${method} ${path} not implemented.`);
}
