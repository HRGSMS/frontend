import { useEffect, useState, type ReactNode } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './auth-state';
import { socketURL } from '../lib/config';

import { SocketContext, type SocketContextType } from './socket-state';
export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [connection, setConnection] = useState<
    SocketContextType & { userId?: string; branchId?: string | number }
  >({ socket: null, isConnected: false });
  const branchId = user?.branchId;
  const userId = user?.id;
  useEffect(() => {
    // Do not subscribe to another property's data by guessing a branch.
    if (!isAuthenticated || branchId == null || branchId === '') return;
    const socket = io(socketURL, { withCredentials: true });
    const onConnect = () => {
      socket.emit('join-branch', branchId);
      setConnection({ socket, isConnected: true, userId, branchId });
    };
    const onDisconnect = () => setConnection({ socket, isConnected: false, userId, branchId });
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onDisconnect);
    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, userId, branchId]);
  const value =
    isAuthenticated &&
    branchId != null &&
    branchId !== '' &&
    connection.userId === userId &&
    connection.branchId === branchId
      ? connection
      : { socket: null, isConnected: false };
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
