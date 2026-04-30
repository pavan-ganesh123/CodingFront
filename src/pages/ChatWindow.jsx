/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getUserFromToken } from "../utils/auth";

function ChatWindow() {
  const { friendId } = useParams();
  const location = useLocation();

  const friend = location.state?.friend;
  const currentUser = getUserFromToken();

  const [ws, setWs] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const socket = new WebSocket(
      `ws://localhost:8081/ws?token=${token}`
    );

    socket.onopen = () => {
      console.log("✅ Connected to Go WebSocket");
    };

    socket.onmessage = (event) => {
      console.log("📩 Incoming:", event.data);

      const msg = JSON.parse(event.data);

      // Go sends: { type, from, message }
      if (msg.type === "private") {
        setChat(prev => [...prev, msg]);
      }
    };

    socket.onclose = () => {
      console.log("❌ Disconnected");
    };

    setWs(socket);

    return () => socket.close();
  }, [friendId]);

  const sendMessage = () => {
    if (!ws || message.trim() === "") return;

    const payload = {
      type: "private",
      to: String(friendId),
      message: message
    };

    console.log("📤 Sending:", payload);

    ws.send(JSON.stringify(payload));

    // 👉 Optimistic UI update (instant display)
    setChat(prev => [
      ...prev,
      {
        type: "private",
        from: currentUser?.email,
        message: message
      }
    ]);

    setMessage("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Chat with {friend?.userName || friendId}</h2>

      <div
        style={{
          height: "300px",
          border: "1px solid gray",
          overflowY: "scroll",
          marginBottom: "10px",
          padding: "10px"
        }}
      >
        {chat.map((msg, index) => {
          const isMe = msg.from === currentUser?.email;

          return (
            <div
              key={index}
              style={{
                textAlign: isMe ? "right" : "left",
                marginBottom: "8px"
              }}
            >
              <span
                style={{
                  background: isMe ? "#4caf50" : "#444",
                  color: "white",
                  padding: "6px 10px",
                  borderRadius: "10px",
                  display: "inline-block"
                }}
              >
                {msg.message}
              </span>
            </div>
          );
        })}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatWindow;