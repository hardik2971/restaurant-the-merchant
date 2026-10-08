// PayPal integration (server side). Uses the Orders v2 REST API (no SDK) with
// OAuth2 client-credentials. The Client ID is public (loaded by the browser SDK);
// the Client Secret is server-only. Sandbox by default — set PAYPAL_ENV=live for
// production. Flow: create order → browser approves via PayPal Buttons → capture
// → server verifies the order reached COMPLETED before fulfilling.
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? '';
const CURRENCY = (process.env.PAYPAL_CURRENCY ?? 'USD').toUpperCase();
const BASE = (process.env.PAYPAL_ENV ?? 'sandbox').toLowerCase() === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export const paypalClientId = CLIENT_ID;
export const paypalCurrency = CURRENCY;

export function paypalConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    throw new Error(`PayPal auth failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/** Create a PayPal order. `amount` is in major units (e.g. 49.99). */
export async function createPayPalOrder(amount: number, description: string): Promise<{ orderId: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: CURRENCY, value: amount.toFixed(2) }, description: description.slice(0, 127) }],
    }),
  });
  if (!res.ok) {
    throw new Error(`PayPal order failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return { orderId: data.id };
}

/** Capture an approved PayPal order. Returns its final status (COMPLETED on success). */
export async function capturePayPalOrder(orderId: string): Promise<{ status: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`PayPal capture failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { status: string };
  return { status: data.status };
}

/** Verify an order reached COMPLETED (retrieved fresh from PayPal). */
export async function verifyPayPalPayment(orderId: string): Promise<boolean> {
  if (!paypalConfigured() || !orderId) return false;
  try {
    const token = await getAccessToken();
    const res = await fetch(`${BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { status: string };
    return data.status === 'COMPLETED';
  } catch {
    return false;
  }
}
