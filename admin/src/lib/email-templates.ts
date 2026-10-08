// Branded HTML email templates — dark "ink" background, gold accent, serif
// display, matching the storefront theme. Uses table layout + inline styles for
// broad email-client compatibility.

const C = {
  ink: '#141210',
  inkSoft: '#1d1a17',
  border: '#2a2620',
  cream: '#f7f1e8',
  muted: '#9a9085',
  gold: '#e0a04b',
  goldDeep: '#c97f2a',
};

const money = (n: number) => `$${n.toFixed(2)}`;

interface OrderEmailItem {
  name: string;
  qty: number;
  price: number;
}

export interface OrderEmailParams {
  number: string;
  customerName: string;
  items: OrderEmailItem[];
  total: number;
  pickupLabel: string; // e.g. "As soon as possible (~25 min)" or "Tue, Jul 2 · 6:30 PM"
  notes?: string;
}

function shell(title: string, inner: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ink};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${C.inkSoft};border:1px solid ${C.border};border-radius:20px;overflow:hidden;">
      <!-- Header -->
      <tr><td style="padding:32px 36px 24px;text-align:center;border-bottom:1px solid ${C.border};">
        <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${C.gold};font-family:Georgia,'Times New Roman',serif;">The Merchant Boston</div>
        <div style="margin-top:6px;font-size:13px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;">Kitchen &amp; Drinks · Boston</div>
      </td></tr>
      ${inner}
      <!-- Footer -->
      <tr><td style="padding:24px 36px 32px;text-align:center;border-top:1px solid ${C.border};">
        <div style="font-size:12px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
          60 Franklin Street, Boston, MA 02110<br>
          +1 617 482 6060 · hello@themerchantboston.com
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function orderConfirmationEmail(p: OrderEmailParams): { subject: string; html: string; text: string } {
  const firstName = p.customerName.split(' ')[0] || 'there';

  const itemsRows = p.items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 0;color:${C.cream};font-family:Arial,Helvetica,sans-serif;font-size:14px;">
          <span style="color:${C.gold};font-weight:bold;">${it.qty}×</span> ${it.name}
        </td>
        <td align="right" style="padding:10px 0;color:${C.muted};font-family:Arial,Helvetica,sans-serif;font-size:14px;white-space:nowrap;">${money(it.qty * it.price)}</td>
      </tr>`,
    )
    .join('');

  const inner = `
      <tr><td style="padding:32px 36px 8px;text-align:center;">
        <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:${C.gold};line-height:56px;font-size:26px;color:${C.ink};font-family:Arial,Helvetica,sans-serif;">&#10003;</div>
        <h1 style="margin:18px 0 6px;font-size:28px;color:${C.cream};font-family:Georgia,'Times New Roman',serif;font-weight:normal;">Order confirmed</h1>
        <p style="margin:0;font-size:14px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
          Thanks, ${firstName} — your take-away order is in. We'll have it ready for pickup.
        </p>
      </td></tr>

      <!-- Order number + pickup -->
      <tr><td style="padding:24px 36px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ink};border:1px solid ${C.border};border-radius:14px;">
          <tr><td style="padding:18px 22px;text-align:center;">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};font-family:Arial,Helvetica,sans-serif;">Order number</div>
            <div style="margin-top:4px;font-size:26px;letter-spacing:1px;color:${C.gold};font-family:Georgia,'Times New Roman',serif;">${p.number}</div>
            <div style="margin-top:10px;font-size:13px;color:${C.cream};font-family:Arial,Helvetica,sans-serif;">Pickup: ${p.pickupLabel}</div>
          </td></tr>
        </table>
      </td></tr>

      <!-- Items -->
      <tr><td style="padding:16px 36px 8px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};font-family:Arial,Helvetica,sans-serif;padding-bottom:6px;border-bottom:1px solid ${C.border};">Your order</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemsRows}
          <tr><td colspan="2" style="border-top:1px solid ${C.border};padding-top:12px;"></td></tr>
          <tr>
            <td style="color:${C.cream};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">Total</td>
            <td align="right" style="color:${C.cream};font-family:Georgia,'Times New Roman',serif;font-size:20px;">${money(p.total)}</td>
          </tr>
        </table>
      </td></tr>
      ${
        p.notes
          ? `<tr><td style="padding:8px 36px 0;">
        <div style="font-size:12px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;">Notes: <span style="color:${C.cream};">${p.notes}</span></div>
      </td></tr>`
          : ''
      }
      <tr><td style="padding:24px 36px 8px;"></td></tr>`;

  const text = [
    `The Merchant Boston — Order confirmed`,
    ``,
    `Thanks, ${firstName}! Your take-away order is in.`,
    `Order number: ${p.number}`,
    `Pickup: ${p.pickupLabel}`,
    ``,
    ...p.items.map((it) => `  ${it.qty}x ${it.name} — ${money(it.qty * it.price)}`),
    `Total: ${money(p.total)}`,
    p.notes ? `Notes: ${p.notes}` : '',
    ``,
    `60 Franklin Street, Boston, MA 02110 · +1 617 482 6060`,
  ]
    .filter(Boolean)
    .join('\n');

  return { subject: `Order ${p.number} confirmed · The Merchant Boston`, html: shell('Order confirmed', inner), text };
}

export interface OrderCompletedParams {
  number: string;
  customerName: string;
  items: OrderEmailItem[];
  total: number;
}

export function orderCompletedEmail(p: OrderCompletedParams): { subject: string; html: string; text: string } {
  const firstName = p.customerName.split(' ')[0] || 'there';

  const itemsRows = p.items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 0;color:${C.cream};font-family:Arial,Helvetica,sans-serif;font-size:14px;">
          <span style="color:${C.gold};font-weight:bold;">${it.qty}×</span> ${it.name}
        </td>
        <td align="right" style="padding:8px 0;color:${C.muted};font-family:Arial,Helvetica,sans-serif;font-size:14px;white-space:nowrap;">${money(it.qty * it.price)}</td>
      </tr>`,
    )
    .join('');

  const inner = `
      <tr><td style="padding:34px 36px 8px;text-align:center;">
        <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:${C.gold};line-height:56px;font-size:26px;color:${C.ink};font-family:Georgia,serif;">&#9733;</div>
        <h1 style="margin:18px 0 6px;font-size:28px;color:${C.cream};font-family:Georgia,'Times New Roman',serif;font-weight:normal;">Thank you, ${firstName}!</h1>
        <p style="margin:0 auto;max-width:420px;font-size:14px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;line-height:1.7;">
          Your order <span style="color:${C.gold};">${p.number}</span> is complete. We hope every bite was
          wood-fired, seasonal and worth savoring — thank you for letting us cook for you.
        </p>
      </td></tr>

      <!-- Order recap -->
      <tr><td style="padding:22px 36px 8px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};font-family:Arial,Helvetica,sans-serif;padding-bottom:6px;border-bottom:1px solid ${C.border};">What you enjoyed</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemsRows}
          <tr><td colspan="2" style="border-top:1px solid ${C.border};padding-top:10px;"></td></tr>
          <tr>
            <td style="color:${C.cream};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;">Total</td>
            <td align="right" style="color:${C.cream};font-family:Georgia,'Times New Roman',serif;font-size:18px;">${money(p.total)}</td>
          </tr>
        </table>
      </td></tr>

      <!-- Come back CTA -->
      <tr><td style="padding:26px 36px 6px;text-align:center;">
        <a href="https://themerchantboston.com/order" style="display:inline-block;background:${C.gold};color:${C.ink};text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:999px;">Order again</a>
        <p style="margin:16px 0 0;font-size:13px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;">We can't wait to welcome you back to the table.</p>
      </td></tr>
      <tr><td style="padding:18px 36px 8px;"></td></tr>`;

  const text = [
    `The Merchant Boston`,
    ``,
    `Thank you, ${firstName}!`,
    `Your order ${p.number} is complete. We hope every bite was worth savoring — thank you for letting us cook for you.`,
    ``,
    `What you enjoyed:`,
    ...p.items.map((it) => `  ${it.qty}x ${it.name} — ${money(it.qty * it.price)}`),
    `Total: ${money(p.total)}`,
    ``,
    `Order again: https://themerchantboston.com/order`,
    `We can't wait to welcome you back to the table.`,
  ].join('\n');

  return { subject: `Thanks for dining with us, ${firstName}! · The Merchant Boston`, html: shell('Thank you', inner), text };
}

const to12h = (t?: string) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = Number(h);
  return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`;
};

export interface ReservationEmailParams {
  reference: string;
  name: string;
  kind: 'TABLE' | 'PRIVATE_EVENT';
  dateLabel: string;
  time?: string;
  guests?: number;
  occasion?: string;
  requests?: string;
  eventType?: string;
  guestRange?: string;
  space?: string;
  message?: string;
}

export function reservationConfirmationEmail(p: ReservationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = p.name.split(' ')[0] || 'there';
  const isTable = p.kind === 'TABLE';

  const rows: [string, string | undefined][] = isTable
    ? [
        ['Date', p.dateLabel],
        ['Time', to12h(p.time)],
        ['Guests', p.guests ? String(p.guests) : undefined],
        ['Occasion', p.occasion],
        ['Requests', p.requests],
      ]
    : [
        ['Event', p.eventType],
        ['Preferred date', p.dateLabel],
        ['Estimated guests', p.guestRange],
        ['Space', p.space],
        ['Details', p.message],
      ];

  const detailRows = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:9px 0;color:${C.muted};font-family:Arial,Helvetica,sans-serif;font-size:13px;">${k}</td>
        <td align="right" style="padding:9px 0;color:${C.cream};font-family:Arial,Helvetica,sans-serif;font-size:14px;">${v}</td>
      </tr>`,
    )
    .join('');

  const headline = isTable ? 'Table reserved' : 'Request received';
  const blurb = isTable
    ? `Thanks, ${firstName} — your table is booked. We can't wait to host you for some wood-fired, seasonal cooking.`
    : `Thanks, ${firstName}. We've received your event request — our events team will reach out within 24 hours to craft your occasion.`;
  const refLabel = isTable ? 'Confirmation' : 'Inquiry reference';

  const inner = `
      <tr><td style="padding:34px 36px 8px;text-align:center;">
        <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:${C.gold};line-height:56px;font-size:26px;color:${C.ink};font-family:Arial,Helvetica,sans-serif;">&#10003;</div>
        <h1 style="margin:18px 0 6px;font-size:28px;color:${C.cream};font-family:Georgia,'Times New Roman',serif;font-weight:normal;">${headline}</h1>
        <p style="margin:0 auto;max-width:430px;font-size:14px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;line-height:1.7;">${blurb}</p>
      </td></tr>

      <tr><td style="padding:24px 36px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ink};border:1px solid ${C.border};border-radius:14px;">
          <tr><td style="padding:18px 22px;text-align:center;">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};font-family:Arial,Helvetica,sans-serif;">${refLabel}</div>
            <div style="margin-top:4px;font-size:26px;letter-spacing:1px;color:${C.gold};font-family:Georgia,'Times New Roman',serif;">${p.reference}</div>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:14px 36px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows}</table>
      </td></tr>
      <tr><td style="padding:22px 36px 8px;"></td></tr>`;

  const text = [
    `The Merchant Boston — ${headline}`,
    ``,
    blurb,
    `${refLabel}: ${p.reference}`,
    ``,
    ...rows.filter(([, v]) => v).map(([k, v]) => `  ${k}: ${v}`),
    ``,
    `60 Franklin Street, Boston, MA 02110 · +1 617 482 6060`,
  ].join('\n');

  return {
    subject: isTable
      ? `Table reserved ${p.reference} · The Merchant Boston`
      : `Event request ${p.reference} · The Merchant Boston`,
    html: shell(headline, inner),
    text,
  };
}

export interface ReservationCompletedParams {
  reference: string;
  name: string;
  kind: 'TABLE' | 'PRIVATE_EVENT';
}

export function reservationCompletedEmail(p: ReservationCompletedParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = p.name.split(' ')[0] || 'there';
  const isTable = p.kind === 'TABLE';

  const blurb = isTable
    ? `Thank you for dining with us. We hope your evening at the table was warm, unhurried and delicious — it was a pleasure to host you.`
    : `Thank you for celebrating with us. We hope your event was everything you imagined — it was an honor to be part of your occasion.`;

  const inner = `
      <tr><td style="padding:34px 36px 8px;text-align:center;">
        <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:${C.gold};line-height:56px;font-size:26px;color:${C.ink};font-family:Georgia,serif;">&#9733;</div>
        <h1 style="margin:18px 0 6px;font-size:28px;color:${C.cream};font-family:Georgia,'Times New Roman',serif;font-weight:normal;">Thank you, ${firstName}!</h1>
        <p style="margin:0 auto;max-width:430px;font-size:14px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;line-height:1.7;">${blurb}</p>
      </td></tr>

      <tr><td style="padding:22px 36px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ink};border:1px solid ${C.border};border-radius:14px;">
          <tr><td style="padding:18px 22px;text-align:center;">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};font-family:Arial,Helvetica,sans-serif;">Reservation</div>
            <div style="margin-top:4px;font-size:24px;letter-spacing:1px;color:${C.gold};font-family:Georgia,'Times New Roman',serif;">${p.reference}</div>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:26px 36px 6px;text-align:center;">
        <a href="https://themerchantboston.com/table-reservation" style="display:inline-block;background:${C.gold};color:${C.ink};text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:999px;">Book again</a>
        <p style="margin:16px 0 0;font-size:13px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;line-height:1.7;">
          We'd love to welcome you back to the table soon.<br>If you have a moment, we'd be grateful for your feedback.
        </p>
      </td></tr>
      <tr><td style="padding:18px 36px 8px;"></td></tr>`;

  const text = [
    `The Merchant Boston`,
    ``,
    `Thank you, ${firstName}!`,
    blurb,
    `Reservation: ${p.reference}`,
    ``,
    `Book again: https://themerchantboston.com/table-reservation`,
    `We'd love to welcome you back to the table soon.`,
  ].join('\n');

  return {
    subject: `Thank you for visiting, ${firstName}! · The Merchant Boston`,
    html: shell('Thank you', inner),
    text,
  };
}

export interface GiftCardEmailParams {
  code: string;
  kind: 'GIFT_CARD' | 'COUPON';
  amount: number;
  name: string;
  message?: string;
  expiryLabel?: string;
}

export function giftCardConfirmationEmail(p: GiftCardEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = p.name.split(' ')[0] || 'there';
  const isGift = p.kind === 'GIFT_CARD';
  const label = isGift ? 'Gift Card' : 'Coupon';

  const inner = `
      <tr><td style="padding:34px 36px 8px;text-align:center;">
        <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:${C.gold};line-height:56px;font-size:26px;color:${C.ink};font-family:Georgia,serif;">&#127873;</div>
        <h1 style="margin:18px 0 6px;font-size:28px;color:${C.cream};font-family:Georgia,'Times New Roman',serif;font-weight:normal;">Your ${label.toLowerCase()} is ready</h1>
        <p style="margin:0 auto;max-width:430px;font-size:14px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;line-height:1.7;">
          Thank you, ${firstName}! Your ${money(p.amount)} ${label.toLowerCase()} for The Merchant Boston is confirmed and ready to use.
        </p>
      </td></tr>

      <!-- The gold card with the code -->
      <tr><td style="padding:24px 36px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.gold};border-radius:16px;">
          <tr><td style="padding:24px;text-align:center;">
            <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.ink};opacity:.7;font-family:Arial,Helvetica,sans-serif;">The Merchant Boston · ${label}</div>
            <div style="margin:10px 0;font-size:30px;font-weight:bold;letter-spacing:3px;color:${C.ink};font-family:'Courier New',monospace;">${p.code}</div>
            <div style="font-size:22px;font-weight:bold;color:${C.ink};font-family:Georgia,'Times New Roman',serif;">${money(p.amount)}</div>
            ${p.expiryLabel ? `<div style="margin-top:6px;font-size:11px;color:${C.ink};opacity:.7;font-family:Arial,Helvetica,sans-serif;">Valid until ${p.expiryLabel}</div>` : `<div style="margin-top:6px;font-size:11px;color:${C.ink};opacity:.7;font-family:Arial,Helvetica,sans-serif;">No expiry</div>`}
          </td></tr>
        </table>
      </td></tr>
      ${
        p.message
          ? `<tr><td style="padding:12px 36px 0;text-align:center;">
        <p style="font-size:13px;font-style:italic;color:${C.muted};font-family:Georgia,serif;">&ldquo;${p.message}&rdquo;</p>
      </td></tr>`
          : ''
      }
      <tr><td style="padding:18px 36px 8px;text-align:center;">
        <p style="font-size:13px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;line-height:1.7;">
          Present this code when dining, ordering online, or booking a private event.
        </p>
      </td></tr>
      <tr><td style="padding:14px 36px 8px;"></td></tr>`;

  const text = [
    `The Merchant Boston — Your ${label} is ready`,
    ``,
    `Thank you, ${firstName}! Your ${money(p.amount)} ${label.toLowerCase()} is confirmed.`,
    `Code: ${p.code}`,
    `Value: ${money(p.amount)}`,
    p.expiryLabel ? `Valid until: ${p.expiryLabel}` : 'No expiry',
    p.message ? `Message: ${p.message}` : '',
    ``,
    `Present this code when dining, ordering online, or booking a private event.`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject: `Your ${label} ${p.code} · The Merchant Boston`,
    html: shell(`Your ${label}`, inner),
    text,
  };
}

export interface GiftCardRedeemedParams {
  code: string;
  kind: 'GIFT_CARD' | 'COUPON';
  amount: number;
  name: string;
}

export function giftCardRedeemedEmail(p: GiftCardRedeemedParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = p.name.split(' ')[0] || 'there';
  const label = p.kind === 'COUPON' ? 'coupon' : 'gift card';

  const inner = `
      <tr><td style="padding:34px 36px 8px;text-align:center;">
        <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:${C.gold};line-height:56px;font-size:26px;color:${C.ink};font-family:Arial,Helvetica,sans-serif;">&#10003;</div>
        <h1 style="margin:18px 0 6px;font-size:28px;color:${C.cream};font-family:Georgia,'Times New Roman',serif;font-weight:normal;">Thank you, ${firstName}!</h1>
        <p style="margin:0 auto;max-width:430px;font-size:14px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;line-height:1.7;">
          Your ${label} <span style="color:${C.gold};">${p.code}</span> (${money(p.amount)}) has been redeemed. We hope it made your visit to The Merchant Boston all the more memorable.
        </p>
      </td></tr>

      <tr><td style="padding:22px 36px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ink};border:1px solid ${C.border};border-radius:14px;">
          <tr><td style="padding:16px 22px;text-align:center;">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};font-family:Arial,Helvetica,sans-serif;">Redeemed</div>
            <div style="margin-top:4px;font-size:20px;letter-spacing:1px;color:${C.gold};font-family:'Courier New',monospace;">${p.code}</div>
            <div style="margin-top:4px;font-size:16px;color:${C.cream};font-family:Georgia,serif;">${money(p.amount)}</div>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:24px 36px 6px;text-align:center;">
        <a href="https://themerchantboston.com/order" style="display:inline-block;background:${C.gold};color:${C.ink};text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:999px;">Visit again</a>
        <p style="margin:16px 0 0;font-size:13px;color:${C.muted};font-family:Arial,Helvetica,sans-serif;">We can't wait to welcome you back to the table.</p>
      </td></tr>
      <tr><td style="padding:18px 36px 8px;"></td></tr>`;

  const text = [
    `The Merchant Boston`,
    ``,
    `Thank you, ${firstName}!`,
    `Your ${label} ${p.code} (${money(p.amount)}) has been redeemed. We hope it made your visit all the more memorable.`,
    ``,
    `Visit again: https://themerchantboston.com/order`,
    `We can't wait to welcome you back to the table.`,
  ].join('\n');

  return {
    subject: `Your ${label} was redeemed — thank you! · The Merchant Boston`,
    html: shell('Redeemed', inner),
    text,
  };
}
