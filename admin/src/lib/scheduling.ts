// Scheduling rules for online ordering & dine-in reservations (TASK 1).
// Server-side authority for business hours, cutoff and pickup estimates.
// The website mirrors this config in `website/lib/order.ts` for the UI — keep
// the two in sync if hours change.

export const BUSINESS_HOURS = {
  openHour: 10, // first slot 10:00
  closeHour: 22, // kitchen closes 22:00 → last slot 21:30
  slotMinutes: 30,
};

/** Minutes a guest must book ahead of a slot ("cutoff time"). */
export const LEAD_MINUTES = 30;

/** Default prep time used to estimate an ASAP take-away pickup. */
export const PREP_MINUTES = 25;

/** Max simultaneous dine-in reservations per 30-min slot (double-booking guard). */
export const SLOT_CAPACITY = 6;

/** All bookable "HH:mm" slots for a service day. */
export function allSlots(): string[] {
  const slots: string[] = [];
  const { openHour, closeHour, slotMinutes } = BUSINESS_HOURS;
  for (let m = openHour * 60; m < closeHour * 60; m += slotMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

/** Combine a "YYYY-MM-DD" date and "HH:mm" time into a Date (server local time). */
export function slotDateTime(date: string, time: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m || !t) return null;
  const d = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(t[1]),
    Number(t[2]),
    0,
    0,
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface SlotCheck {
  ok: boolean;
  reason?: string;
}

/** Validate a scheduled date+time: real slot, within hours, past the cutoff. */
export function validateSlot(date: string, time: string, now = new Date()): SlotCheck {
  if (!allSlots().includes(time)) {
    return { ok: false, reason: 'Outside business hours' };
  }
  const when = slotDateTime(date, time);
  if (!when) return { ok: false, reason: 'Invalid date or time' };
  if (when.getTime() < now.getTime() + LEAD_MINUTES * 60_000) {
    return { ok: false, reason: 'That time is too soon — please pick a later slot' };
  }
  return { ok: true };
}

/** Estimated pickup Date for a take-away order. */
export function estimatePickup(
  scheduleType: 'NOW' | 'LATER',
  date?: string,
  time?: string,
  now = new Date(),
): Date {
  if (scheduleType === 'LATER' && date && time) {
    return slotDateTime(date, time) ?? new Date(now.getTime() + PREP_MINUTES * 60_000);
  }
  return new Date(now.getTime() + PREP_MINUTES * 60_000);
}
