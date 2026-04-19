import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = "http://localhost:8080/ws";

export function useWebSocket({ gamePin, nickname, onPlayersUpdate }) {
  const clientRef = useRef(null);
  const onPlayersUpdateRef = useRef(onPlayersUpdate);
  onPlayersUpdateRef.current = onPlayersUpdate;

  const disconnect = useCallback(() => {
    if (clientRef.current?.active) {
      clientRef.current.deactivate();
    }
  }, []);

  useEffect(() => {
    if (!gamePin) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("WebSocket connected");
        client.subscribe(`/topic/game/${gamePin}/players`, (message) => {
          const data = JSON.parse(message.body);
          if (onPlayersUpdateRef.current) onPlayersUpdateRef.current(data.players);
        });
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