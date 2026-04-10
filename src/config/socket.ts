import { Server } from 'socket.io';

/**
 * Socket.io singleton — breaks the circular dependency between
 * index.ts (which creates `io`) and messageController.ts (which uses it).
 *
 * Usage:
 *   index.ts      → setIo(new Server(...))
 *   anywhere else → getIo().to(room).emit(...)
 */
let _io: Server | null = null;

export const setIo = (instance: Server): void => {
  _io = instance;
};

export const getIo = (): Server => {
  if (!_io) throw new Error('[Socket] io not initialised — call setIo() first');
  return _io;
};
