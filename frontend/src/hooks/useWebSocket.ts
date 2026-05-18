import { useEffect, useRef, useState, useCallback } from 'react';
import { SimulationEvent } from '../types';

export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SimulationEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>();
  const eventHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: SimulationEvent = JSON.parse(event.data);
          setLastEvent(data);

          // Call registered handlers
          const handler = eventHandlersRef.current.get(data.type);
          if (handler) {
            handler(data.data);
          }

          // Call wildcard handler
          const wildcardHandler = eventHandlersRef.current.get('*');
          if (wildcardHandler) {
            wildcardHandler(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const on = useCallback((eventType: string, handler: (data: any) => void) => {
    eventHandlersRef.current.set(eventType, handler);
  }, []);

  const off = useCallback((eventType: string) => {
    eventHandlersRef.current.delete(eventType);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastEvent,
    on,
    off,
  };
};
