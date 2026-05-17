import { describe, it, expect, vi, beforeEach } from 'vitest';
import { connectSocket, disconnectSocket, getSocket, joinBoard, leaveBoard } from '../socket';

const mockIo = vi.fn();
vi.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => mockIo(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  disconnectSocket();
});

describe('socket', () => {
  it('returns null initially', () => {
    expect(getSocket()).toBeNull();
  });

  it('connects with token', () => {
    const mockSocket = { connected: false, on: vi.fn(), emit: vi.fn(), disconnect: vi.fn() };
    mockIo.mockReturnValue(mockSocket);
    const socket = connectSocket('token123');
    expect(socket).toBe(mockSocket);
    expect(getSocket()).toBe(mockSocket);
    expect(mockIo).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ auth: { token: 'token123' } }));
  });

  it('returns existing socket if already connected', () => {
    const mockSocket = { connected: true, on: vi.fn(), emit: vi.fn(), disconnect: vi.fn() };
    mockIo.mockReturnValue(mockSocket);
    connectSocket('token123');
    const socket2 = connectSocket('token456');
    expect(socket2).toBe(mockSocket);
    expect(mockIo).toHaveBeenCalledTimes(1);
  });

  it('disconnects socket', () => {
    const disconnect = vi.fn();
    mockIo.mockReturnValue({ connected: false, on: vi.fn(), emit: vi.fn(), disconnect });
    connectSocket('tok');
    disconnectSocket();
    expect(disconnect).toHaveBeenCalled();
    expect(getSocket()).toBeNull();
  });

  it('joinBoard emits board:join', () => {
    const emit = vi.fn();
    mockIo.mockReturnValue({ connected: false, on: vi.fn(), emit, disconnect: vi.fn() });
    connectSocket('tok');
    joinBoard('b1');
    expect(emit).toHaveBeenCalledWith('board:join', { boardId: 'b1' });
  });

  it('leaveBoard emits board:leave', () => {
    const emit = vi.fn();
    mockIo.mockReturnValue({ connected: false, on: vi.fn(), emit, disconnect: vi.fn() });
    connectSocket('tok');
    leaveBoard('b1');
    expect(emit).toHaveBeenCalledWith('board:leave', { boardId: 'b1' });
  });
});
