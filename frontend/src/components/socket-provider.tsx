'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

interface SocketContextType {
  isConnected: boolean;
  lastPing: number | null;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  lastPing: null,
  reconnect: () => {},
});

export function useSocket() {
  return useContext(SocketContext);
}

/**
 * SocketProvider — Global WebSocket connection status.
 * Uses native WebSocket to match FastAPI backend (NOT socket.io).
 * Individual stream WebSocket connections are handled by the useWebSocket hook.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/health');
      const data = await res.json();
      const connected = data?.status === 'ok';
      setIsConnected(connected);
      if (connected) {
        setLastPing(Date.now());
      }
    } catch {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    // Check immediately
    checkConnection();

    // Poll backend health every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [checkConnection]);

  const reconnect = useCallback(() => {
    checkConnection();
  }, [checkConnection]);

  return (
    <SocketContext.Provider value={{ isConnected, lastPing, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
}
