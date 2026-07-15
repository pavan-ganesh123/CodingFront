/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useContext,
    useEffect,
    useRef
} from "react";
import { isTokenExpired } from "../utils/auth";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {

    const socketRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const manualCloseRef = useRef(false);
    const backoffRef = useRef(1000); // start at 1s, cap below

    useEffect(() => {

        const clearReconnectTimer = () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
        };

        const scheduleReconnect = () => {
            clearReconnectTimer();
            reconnectTimerRef.current = setTimeout(() => {
                connect();
            }, backoffRef.current);
            backoffRef.current = Math.min(backoffRef.current * 2, 30000); // cap at 30s
        };

        const connect = () => {

            const token = localStorage.getItem("token");

            if (!token) {
                console.log("No token found, skipping websocket connect");
                return;
            }

            if (isTokenExpired(token)) {
                console.log("Token expired, skipping websocket connect");
                return;
            }

            const existing = socketRef.current;

            if (
                existing &&
                (existing.readyState === WebSocket.OPEN ||
                    existing.readyState === WebSocket.CONNECTING)
            ) {
                console.log("Websocket already connecting/connected");
                return;
            }

            console.log("Creating websocket...");
            manualCloseRef.current = false;

            const ws = new WebSocket(
                `ws://chatloop-j8fz.onrender.com/ws?token=${token}`
            );

            socketRef.current = ws;

            ws.onopen = () => {
                console.log("WS connected");
                backoffRef.current = 1000; // reset backoff on success
            };

            ws.onclose = (event) => {
                console.log("WS disconnected", event.code, event.reason);
                socketRef.current = null;

                if (!manualCloseRef.current) {
                    scheduleReconnect();
                }
            };

            ws.onerror = (err) => {
                console.error("WS Error", err);
            };
        };

        const disconnect = () => {
            manualCloseRef.current = true;
            clearReconnectTimer();
            if (socketRef.current) {
                console.log("Closing websocket");
                socketRef.current.close();
                socketRef.current = null;
            }
        };

        // Covers page refresh: token already exists at mount time
        connect();

        // Covers login/logout happening in this tab without a remount
        const handleAuthChange = () => {
            const token = localStorage.getItem("token");
            if (token && !isTokenExpired(token)) {
                connect();
            } else {
                disconnect();
            }
        };

        // Covers login/logout happening in a *different* tab
        window.addEventListener("auth-changed", handleAuthChange);
        window.addEventListener("storage", handleAuthChange);

        return () => {
            window.removeEventListener("auth-changed", handleAuthChange);
            window.removeEventListener("storage", handleAuthChange);
            disconnect();
        };

    }, []);

    return (
        <WebSocketContext.Provider value={socketRef}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    return useContext(WebSocketContext);
};