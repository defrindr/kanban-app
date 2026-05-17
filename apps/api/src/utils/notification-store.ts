interface Notification {
  id: string; userId: string; type: string; message: string; read: boolean; createdAt: string;
}

const notifications = new Map<string, Notification[]>()

export function addNotification(userId: string, data: Omit<Notification, 'id' | 'createdAt'>): Notification {
  const n: Notification = {
    ...data,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  const list = notifications.get(userId) || []
  list.unshift(n)
  notifications.set(userId, list)
  return n
}

export function getNotifications(userId: string): Notification[] {
  return notifications.get(userId) || []
}

export function markRead(userId: string, id: string): boolean {
  const list = notifications.get(userId)
  if (!list) return false
  const n = list.find(x => x.id === id)
  if (!n) return false
  n.read = true
  return true
}

export function markAllRead(userId: string): void {
  const list = notifications.get(userId)
  if (!list) return
  for (const n of list) { n.read = true }
}
