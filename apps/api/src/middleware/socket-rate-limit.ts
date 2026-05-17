import { Socket } from 'socket.io';
import { redis } from '../app.js';

const config = {
  windowMs: 60 * 1000,
  maxPerEvent: 30,
  maxTotal: 200,
};

export async function checkSocketRateLimit(socket: Socket, event: string): Promise<boolean> {
  try {
    const userId = socket.data.user?.userId || socket.id;
    const eventKey = `socket:ratelimit:${userId}:${event}`;
    const totalKey = `socket:ratelimit:${userId}:total`;

    const [eventCount, totalCount] = await Promise.all([
      redis.incr(eventKey),
      redis.incr(totalKey),
    ]);

    if (eventCount === 1) {
      await redis.pexpire(eventKey, config.windowMs);
    }
    if (totalCount === 1) {
      await redis.pexpire(totalKey, config.windowMs);
    }

    if (eventCount > config.maxPerEvent || totalCount > config.maxTotal) {
      socket.emit('error', {
        ok: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests' },
      });
      return false;
    }

    return true;
  } catch {
    return true;
  }
}
