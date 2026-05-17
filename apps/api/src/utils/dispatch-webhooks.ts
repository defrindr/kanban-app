import { prisma } from '../app.js';
import { dispatchWebhook } from './webhooks.js';
import type { WebhookPayload } from './webhooks.js';

export async function notifyWebhooks(
  boardId: string,
  event: string,
  actor: { userId: string; email: string },
  data: Record<string, unknown>,
) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { boardId, active: true, events: { has: event } },
    });

    if (webhooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      boardId,
      timestamp: new Date().toISOString(),
      actor,
      data,
    };

    await Promise.allSettled(
      webhooks.map(wh => dispatchWebhook(wh.url, wh.secret, payload)),
    );
  } catch {
    // webhook failures are non-critical
  }
}
