import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = process.env.REACT_APP_WS_URL;

export function useWebSocket({ gamePin, nickname, onPlayersUpdate, onKicked, onQuestion, onQuestionResult, onAnswerCount, onGameEnded }) {
  const clientRef = useRef(null);
  const onPlayersUpdateRef = useRef(onPlayersUpdate);
  const onKickedRef = useRef(onKicked);
  const onQuestionRef = useRef(onQuestion);
  const onQuestionResultRef = useRef(onQuestionResult);
  const onAnswerCountRef = useRef(onAnswerCount);
  const onGameEndedRef = useRef(onGameEnded);

  onPlayersUpdateRef.current = onPlayersUpdate;
  onKickedRef.current = onKicked;
  onQuestionRef.current = onQuestion;
  onQuestionResultRef.current = onQuestionResult;
  onAnswerCountRef.current = onAnswerCount;
  onGameEndedRef.current = onGameEnded;

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

        client.subscribe(`/topic/game/${gamePin}/question`, (message) => {
          const data = JSON.parse(message.body);
          if (onQuestionRef.current) onQuestionRef.current(data);
        });

        client.subscribe(`/topic/game/${gamePin}/question-result`, (message) => {
          const data = JSON.parse(message.body);
          if (onQuestionResultRef.current) onQuestionResultRef.current(data);
        });

        client.subscribe(`/topic/game/${gamePin}/answer-count`, (message) => {
          const data = JSON.parse(message.body);
          if (onAnswerCountRef.current) onAnswerCountRef.current(data);
        });

        // New: /finished carries full leaderboard
        client.subscribe(`/topic/game/${gamePin}/finished`, (message) => {
          const data = JSON.parse(message.body);
          if (onGameEndedRef.current) onGameEndedRef.current(data);
        });

        if (nickname) {
          client.subscribe(`/topic/game/${gamePin}/kicked`, (message) => {
            const data = JSON.parse(message.body);
            const kickedNickname = [...data.players][0];
            if (kickedNickname === nickname && onKickedRef.current) {
              onKickedRef.current();
            }
          });

          client.publish({
            destination: "/app/game.join",
            body: JSON.stringify({ gamePin, nickname }),
          });
        }
      },
      onDisconnect: () => console.log("WebSocket disconnected"),
      onStompError: (frame) => console.error("STOMP error", frame),
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, [gamePin, nickname]);

  return { disconnect };
}
