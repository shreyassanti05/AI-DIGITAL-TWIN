'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: 'frame' | 'alert' | 'detection_update' | 'status' | 'pong';
  stream_id?: string;
  timestamp?: number;
  frame?: string; // base64 encoded
  detections?: any[];
  threat_level?: string;
  alert_count?: number;
  fps?: number;
  alert?: any;
  stats?: any;
}

interface UseWebSocketOptions {
  streamId: string;
  onFrame?: (data: WebSocketMessage) => void;
  onAlert?: (data: WebSocketMessage) => void;
  onDetectionUpdate?: (data: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean; // Only connect when true (default: true)
}

export function useWebSocket({
  streamId,
  onFrame,
  onAlert,
  onDetectionUpdate,
  onConnect,
  onDisconnect,
  onError,
  enabled = true,
}: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const pingIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const mountedRef = useRef(true);

  // Use refs for callbacks to avoid reconnection loops
  const callbacksRef = useRef({ onFrame, onAlert, onDetectionUpdate, onConnect, onDisconnect, onError });
  callbacksRef.current = { onFrame, onAlert, onDetectionUpdate, onConnect, onDisconnect, onError };

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;
    if (ws.current?.readyState === WebSocket.OPEN) return;
    
    // Close any existing connection
    if (ws.current) {
      try { ws.current.close(); } catch {}
      ws.current = null;
    }

    setIsConnecting(true);

    // WebSocket URL - must match backend port
    const wsUrl = 'ws://127.0.0.1:8001';
    const socket = new WebSocket(`${wsUrl}/api/v1/streams/ws/${streamId}`);

    socket.onopen = () => {
      if (!mountedRef.current) { socket.close(); return; }
      console.log(`[WebSocket] Connected to stream: ${streamId}`);
      setIsConnected(true);
      setIsConnecting(false);
      callbacksRef.current.onConnect?.();
      
      // Send ping to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ action: 'ping' }));
        } else {
          clearInterval(pingIntervalRef.current);
        }
      }, 30000);
    };

    socket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        switch (data.type) {
          case 'frame':
            callbacksRef.current.onFrame?.(data);
            break;
          case 'alert':
            callbacksRef.current.onAlert?.(data);
            break;
          case 'detection_update':
            callbacksRef.current.onDetectionUpdate?.(data);
            break;
          case 'pong':
            // Heartbeat received
            break;
        }
      } catch (error) {
        console.error('[WebSocket] Parse error:', error);
      }
    };

    socket.onclose = () => {
      if (!mountedRef.current) return;
      console.log(`[WebSocket] Disconnected from stream: ${streamId}`);
      setIsConnected(false);
      setIsConnecting(false);
      callbacksRef.current.onDisconnect?.();

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      // Auto-reconnect after 3 seconds (only if still mounted)
      if (mountedRef.current && enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && enabled) {
            console.log('[WebSocket] Attempting reconnect...');
            connect();
          }
        }, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      callbacksRef.current.onError?.(error);
    };

    ws.current = socket;
  }, [streamId, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (ws.current) {
      try { ws.current.close(); } catch {}
      ws.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      connect();
    }
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendMessage,
  };
}
