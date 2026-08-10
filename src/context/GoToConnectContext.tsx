import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import type {
  CallNotification,
  GoToConnectCallAnsweredEvent,
} from "../lib/goToConnect/types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string | undefined;
const MAX_HISTORY = 30;

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

type GoToConnectContextType = {
  status: ConnectionStatus;
  calls: CallNotification[];
  latestCall: CallNotification | null;
  unseenCount: number;
  dismissToast: () => void;
  markAllSeen: () => void;
  clearHistory: () => void;
};

const GoToConnectContext = createContext<GoToConnectContextType | undefined>(
  undefined
);

export const useGoToConnect = () => {
  const context = useContext(GoToConnectContext);
  if (!context) {
    throw new Error("useGoToConnect must be used within a GoToConnectProvider");
  }
  return context;
};

export const GoToConnectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const token = useAuthStore((s) => s.token);

  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [calls, setCalls] = useState<CallNotification[]>([]);
  const [latestCall, setLatestCall] = useState<CallNotification | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !SOCKET_URL) {
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");
    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      timeout: 15000,
      auth: { token: `Bearer ${token}` },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.info("[GoToConnect] connected", socket.id);
      setStatus("connected");
    });
    socket.on("disconnect", (reason) => {
      console.info("[GoToConnect] disconnected:", reason);
      setStatus("disconnected");
    });
    socket.on("connect_error", (error) => {
      const details = error as Error & { description?: unknown; context?: unknown };
      console.error(
        "[GoToConnect] connect_error:",
        details.message,
        "| description:",
        details.description,
        "| context:",
        details.context
      );
      setStatus("error");
    });

    // The server assigns this socket to a room (based on the auth token) before it will
    // start emitting call-answered events — log both outcomes so a silent failure is visible.
    socket.on("goto-connect:room-joined", (roomData) => {
      console.info("[GoToConnect] room joined:", roomData);
    });
    socket.on("goto-connect:room-join-error", (errorData) => {
      console.error("[GoToConnect] room join error:", errorData);
    });

    socket.on(
      "goto-connect:call-answered",
      (payload: GoToConnectCallAnsweredEvent) => {
        console.info("[GoToConnect] call-answered received:", payload);
        const notification: CallNotification = {
          localId: `${payload.conversationId}-${payload.occurredAt}`,
          receivedAt: Date.now(),
          seen: false,
          event: payload,
        };
        setCalls((prev) => [notification, ...prev].slice(0, MAX_HISTORY));
        setLatestCall(notification);
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const unseenCount = calls.filter((c) => !c.seen).length;

  return (
    <GoToConnectContext.Provider
      value={{
        status,
        calls,
        latestCall,
        unseenCount,
        dismissToast: () => setLatestCall(null),
        markAllSeen: () => setCalls((prev) => prev.map((c) => ({ ...c, seen: true }))),
        clearHistory: () => {
          setCalls([]);
          setLatestCall(null);
        },
      }}
    >
      {children}
    </GoToConnectContext.Provider>
  );
};
