import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function joinBoard(boardId: string) {
  socket?.emit('board:join', { boardId })
}

export function leaveBoard(boardId: string) {
  socket?.emit('board:leave', { boardId })
}
