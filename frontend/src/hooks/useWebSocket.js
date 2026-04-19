import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = "http://localhost:8080/ws";

export function useWebSocket({ gamePin, nickname, onPlayersUpdate }) {
  const clientRef = useRef(null);

  const disconnect = useCallback(() => {
    if (clientRef.current?.active) {
      clientRef.current.deactivate();
    }
  }, []);

  useEffect(() => {
    if (!gamePin) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000, // auto-reconnect after 5 seconds
      onConnect: () => {
        console.log("WebSocket connected");

        // Subscribe to player list updates for this game
        client.subscribe(`/topic/game/${gamePin}/players`, (message) => {
          const data = JSON.parse(message.body);
          if (onPlayersUpdate) onPlayersUpdate(data.players);
        });

        // Send join message if nickname provided
        if (nickname) {
          client.publish({
            destination: "/app/game.join",
            body: JSON.stringify({ gamePin, nickname }),
          });
        }
      },
      onDisconnect: () => {
        console.log("WebSocket disconnected");
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [gamePin, nickname]);

  return { disconnect };
}