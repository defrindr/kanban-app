import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { getNotifications, markRead, markAllRead } from '../utils/notification-store.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const notifs = getNotifications(req.user!.userId);
  res.json({ ok: true, data: notifs });
}));

router.put('/:id/read', asyncHandler(async (req, res) => {
  const ok = markRead(req.user!.userId, req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
  res.json({ ok: true, data: { success: true } });
}));

router.put('/read-all', asyncHandler(async (req, res) => {
  markAllRead(req.user!.userId);
  res.json({ ok: true, data: { success: true } });
}));

export default router;
