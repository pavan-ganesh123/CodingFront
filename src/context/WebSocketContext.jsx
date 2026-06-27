/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useContext,
    useEffect,
    useRef
} from "react";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {

    const socketRef = useRef(null);

    useEffect(() => {

        const connect = () => {

            const token = localStorage.getItem("token");

            if (!token) {
                console.log("No token found, skipping websocket connect");
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

            const ws = new WebSocket(
                `ws://localhost:8081/ws?token=${token}`
            );

            socketRef.current = ws;

            ws.onopen = () => {
                console.log("WS connected");
            };

            ws.onclose = (event) => {
                console.log(
                    "WS disconnected",
                    event.code,
                    event.reason
                );
            };

            ws.onerror = (err) => {
                console.error("WS Error", err);
            };
        };

        const disconnect = () => {
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
            if (token) {
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
