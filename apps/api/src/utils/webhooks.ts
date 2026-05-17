import { createHmac, timingSafeEqual } from 'crypto';

export interface WebhookPayload {
  event: string;
  boardId: string;
  timestamp: string;
  actor: { userId: string; email: string };
  data: Record<string, unknown>;
}

function signPayload(payload: WebhookPayload, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

export function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function dispatchWebhook(
  url: string,
  secret: string,
  payload: WebhookPayload,
): Promise<boolean> {
  const signature = signPayload(payload, secret);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}
