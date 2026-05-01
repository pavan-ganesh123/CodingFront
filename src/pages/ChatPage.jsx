/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef, useState } from "react";
import { gql } from "graphql-request";
import { getClient } from "../api/graphqlClient";
import { getUserFromToken } from "../utils/auth";

import "./ChatPage.css";

function ChatPage() {

  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const [ws, setWs] = useState(null);

  const [message, setMessage] = useState("");

  // ALL chats stored here
  const [chat, setChat] = useState([]);

  const messagesEndRef = useRef(null);

  const user = getUserFromToken();

  const userId = user?.userId;

  const client = getClient();

  const GET_FRIENDS = gql`
    query($userId: ID!) {
      getAllFriends(userId: $userId) {
        id
        status
        user {
          id
          userName
          email
        }
        friend {
          id
          userName
          email
        }
      }
    }
  `;

  useEffect(() => {

    if (userId) {
      fetchFriends();
    }

  }, [userId]);

  const fetchFriends = async () => {

    try {

      const data = await client.request(GET_FRIENDS, {
        userId
      });

      const friendList = data.getAllFriends
        .filter(f => f.status === "ACCEPTED")
        .map(f =>
          String(f.user.id) === String(userId)
            ? f.friend
            : f.user
        );

      setFriends(friendList);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {

    const token = localStorage.getItem("token");

    const socket = new WebSocket(
      `ws://localhost:8081/ws?token=${token}`
    );

    socket.onopen = () => {
      console.log("WebSocket Connected");
    };

    socket.onmessage = (event) => {

      const msg = JSON.parse(event.data);

      console.log("Incoming:", msg);

      if (msg.type === "private") {

        setChat(prev => [
          ...prev,
          msg
        ]);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    socket.onerror = (err) => {
      console.error("WS Error:", err);
    };

    setWs(socket);

    return () => socket.close();

  }, []);


  const sendMessage = () => {

    if (!selectedFriend) return;

    if (!message.trim()) return;

    if (!ws) return;

    const payload = {
      type: "private",
      to: String(selectedFriend.id),
      message
    };

    console.log("Sending:", payload);

    ws.send(JSON.stringify(payload));

    setChat(prev => [
      ...prev,
      {
        type: "private",
        from: user?.email,
        to: String(selectedFriend.id),
        message
      }
    ]);

    setMessage("");
  };

  const filteredChat = useMemo(() => {

    if (!selectedFriend) return [];

    return chat.filter(msg => {

      // SENT BY ME TO SELECTED FRIEND
      const sentByMe =
        msg.from === user?.email &&
        String(msg.to) === String(selectedFriend.id);

      // RECEIVED FROM SELECTED FRIEND
      const receivedFromFriend =
        msg.from === selectedFriend.email ||
        msg.from === selectedFriend.userName;

      return sentByMe || receivedFromFriend;

    });

  }, [chat, selectedFriend, user]);

  /* =========================
     AUTO SCROLL
  ========================= */

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [filteredChat]);



  const handleKeyDown = (e) => {

    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (

    <div className="chat-layout">



      <div className="chat-sidebar">

        <div className="sidebar-header">
          Messages
        </div>

        <div className="friends-list">

          {friends.length === 0 ? (

            <div className="empty-friends">
              No friends found
            </div>

          ) : (

            friends.map(friend => (

              <div
                key={friend.id}
                className={`chat-user ${
                  selectedFriend?.id === friend.id
                    ? "selected"
                    : ""
                }`}
                onClick={() => setSelectedFriend(friend)}
              >

                <div className="friend-info">

                  <div className="friend-name">
                    {friend.userName}
                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </div>


      <div className="chat-main">

        {!selectedFriend ? (

          <div className="empty-chat">

            <div className="empty-chat-box">

              <h2>Welcome to Chat</h2>

              <p>
                Select a friend from the sidebar
                to start messaging
              </p>

            </div>

          </div>

        ) : (

          <>

            {/* HEADER */}

            <div className="chat-header">

              <div className="chat-header-left">

                <div>

                  <div className="chat-friend-name">
                    {selectedFriend.userName}
                  </div>

                </div>

              </div>

            </div>

            {/* MESSAGES */}

            <div className="chat-messages">

              {filteredChat.length === 0 ? (

                <div className="no-messages">
                  Start your conversation 👋
                </div>

              ) : (

                filteredChat.map((msg, index) => {

                  const isMe =
                    msg.from === user?.email;

                  return (

                    <div
                      key={index}
                      className={`message-row ${
                        isMe ? "me" : "other"
                      }`}
                    >

                      <div className="message-bubble">
                        {msg.message}
                      </div>

                    </div>

                  );
                })

              )}

              <div ref={messagesEndRef} />

            </div>

            {/* INPUT */}

            <div className="chat-input-area">

              <input
                type="text"
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
              />

              <button onClick={sendMessage}>
                Send
              </button>

            </div>

          </>

        )}

      </div>

    </div>
  );
}

export default ChatPage;