/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef, useState } from "react";
import { gql } from "graphql-request";

import { getClient } from "../api/graphqlClient";
import { getUserFromToken } from "../utils/auth";
import { FaTrashAlt } from "react-icons/fa";
import { MdReply } from "react-icons/md";
import "./ChatPage.css";
import { useWebSocket }
from "../context/WebSocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { useFriends } from "../hooks/useFriends";

function ChatPage() {

  const queryClient = useQueryClient();
  const [selectedFriend, setSelectedFriend] = useState(null);


  const [message, setMessage] = useState("");

  const [chat, setChat] = useState([]);

  const [replyingTo, setReplyingTo] = useState(null);

  const [showChatMenu, setShowChatMenu] = useState(false);

  const [showSidebarMenu, setShowSidebarMenu] = useState(false);

  const messagesEndRef = useRef(null);

  const user = getUserFromToken();

  const userId = user?.userId;

  const client = getClient();
  const socketRef = useWebSocket();
  // =====================================================
  // GRAPHQL
  // =====================================================
  const {
      data: friends = []
  } = useFriends(userId);

const GET_MESSAGES = gql`
  query($senderId: ID!, $receiverId: ID!) {
    messages(
      senderId: $senderId,
      receiverId: $receiverId
    ) {
      messageId
      senderId
      receiverId
      content
      messageType
      sharedPostId
      sharedPost {
        id
        questionTitle
        primaryImageUrl
      }
      deletedForEveryone
      replyToMessageId
      starred
      createdAt
    }
  }
`;

  const STAR_MESSAGE = gql`
    mutation($messageId: String!) {
      starMessage(messageId: $messageId) {
        messageId
        starred
      }
    }
  `;

  const UNSTAR_MESSAGE = gql`
    mutation($messageId: String!) {
      unstarMessage(messageId: $messageId) {
        messageId
        starred
      }
    }
  `;

  const BLOCK_USER = gql`
    mutation($userId: ID!, $targetUserId: ID!) {
      blockUser(
        userId: $userId,
        targetUserId: $targetUserId
      ) {
        id
      }
    }
  `;

  // =====================================================
  // FETCH FRIENDS
  // =====================================================

  

  // =====================================================
  // FETCH SAVED MESSAGES
  // =====================================================

  useEffect(() => {

    if (!selectedFriend) return;

    fetchMessages();

  }, [selectedFriend]);

  const fetchMessages = async () => {

    try {

      const data = await client.request(
        GET_MESSAGES,
        {
          senderId: Number(userId),
          receiverId: Number(selectedFriend.id)
        }
      );

      const formatted = data.messages.map(msg => ({
        type:
          msg.messageType === "POST_SHARE"
            ? "share_post"
            : "private",

        messageId: msg.messageId,
        fromUserId: String(msg.senderId),
        to: String(msg.receiverId),

        message: msg.content,

        messageType: msg.messageType,
        postId: msg.sharedPost?.id ?? msg.sharedPostId,
        postTitle: msg.sharedPost?.questionTitle,
        postImage: msg.sharedPost?.primaryImageUrl,

        deletedForEveryone: msg.deletedForEveryone,
        replyToMessageId: msg.replyToMessageId,
        starred: msg.starred,
        createdAt: msg.createdAt
      }));

      setChat(formatted);

    } catch (err) {
      console.error(err);
    }
  };

  // =====================================================
  // WEBSOCKET
  // =====================================================

  useEffect(() => {

    if (!socketRef.current) {
        return;
    }

    const socket = socketRef.current;

      const handleMessage = (event) => {

          const msg = JSON.parse(event.data);

          if (
              msg.type === "private" ||
              msg.type === "share_post"
          ) {

              setChat(prev => {

                  const exists = prev.some(
                      m => m.messageId === msg.messageId
                  );

                  if (exists) {
                      return prev;
                  }

                  return [...prev, msg];
              });
          }

          if (msg.type === "delete") {

              setChat(prev =>
                  prev.map(m =>
                      m.messageId === msg.messageId
                          ? {
                              ...m,
                              deletedForEveryone: true
                          }
                          : m
                  )
              );
          }
      };

      socket.addEventListener(
          "message",
          handleMessage
      );

      return () => {
          socket.removeEventListener(
              "message",
              handleMessage
          );
      };

  }, [socketRef]);

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = () => {

    if (!selectedFriend) return;

    if (!message.trim()) return;

    if (
        !socketRef.current ||
        socketRef.current.readyState !== WebSocket.OPEN
    ) {
        console.log("WebSocket not connected");
        return;
    }

    const payload = {
        type: "private",
        to: String(selectedFriend.id),
        message,
        replyToMessageId:
            replyingTo?.messageId || null
    };

    socketRef.current.send(
        JSON.stringify(payload)
    );

    setMessage("");
    setReplyingTo(null);
};

  const deleteForEveryone = (msg) => {

    if (
        !socketRef.current ||
        socketRef.current.readyState !== WebSocket.OPEN
    ) {
        return;
    }

    socketRef.current.send(
        JSON.stringify({
            type: "delete",
            messageId: msg.messageId,
            to: msg.to
        })
    );
};

  // =====================================================
  // FILTER CHAT
  // =====================================================

  const filteredChat = useMemo(() => {

    if (!selectedFriend) return [];

    return chat.filter(msg => {

      const sentByMe =
        String(msg.fromUserId) === String(userId) &&
        String(msg.to) === String(selectedFriend.id);

      const receivedFromFriend =
        String(msg.fromUserId) ===
        String(selectedFriend.id);

      return sentByMe || receivedFromFriend;

    });

  }, [chat, selectedFriend, userId]);

  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [filteredChat]);

  // =====================================================
  // ENTER SEND
  // =====================================================

  const handleKeyDown = (e) => {

    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // =====================================================
  // STAR MESSAGE
  // =====================================================

  const toggleStar = async (msg) => {

    try {

      if (msg.starred) {

        await client.request(
          UNSTAR_MESSAGE,
          {
            messageId: msg.messageId
          }
        );

      } else {

        await client.request(
          STAR_MESSAGE,
          {
            messageId: msg.messageId
          }
        );
      }

      setChat(prev =>
        prev.map(m =>
          m.messageId === msg.messageId
            ? {
                ...m,
                starred: !m.starred
              }
            : m
        )
      );

    } catch (err) {
      console.error(err);
    }
  };

  // =====================================================
  // BLOCK USER
  // =====================================================

  const handleBlockUser = async () => {

    if (!selectedFriend) return;

    const confirmBlock = window.confirm(
      `Block ${selectedFriend.userName}?`
    );

    if (!confirmBlock) return;

    try {

      await client.request(BLOCK_USER, {
        userId,
        targetUserId: selectedFriend.id
      });

      queryClient.setQueryData(
            ["friends", userId],
            (oldFriends = []) =>
                oldFriends.filter(
                    f => String(f.id) !== String(selectedFriend.id)
                )
        );

      setSelectedFriend(null);

      setShowChatMenu(false);

      alert("User blocked");

    } catch (err) {
      console.error(err);
    }
  };

  // =====================================================
  // FIND REPLY MESSAGE
  // =====================================================

  const findReplyMessage = (replyId) => {

    return chat.find(
      m => m.messageId === replyId
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="chat-layout">

      {/* SIDEBAR */}

      <div className="chat-sidebar">

        <div className="sidebar-header">

          <span>Messages</span>

          <div className="sidebar-top-menu">

            <button
              className="sidebar-menu-button"
              onClick={() =>
                setShowSidebarMenu(prev => !prev)
              }
            >
              ⋮
            </button>

            {showSidebarMenu && (

              <div className="sidebar-dropdown">

                <div
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    window.location.href =
                      "/blocked-users";
                  }}
                >
                  Blocked Users
                </div>

              </div>
            )}

          </div>

        </div>

        <div className="friends-list">

          {friends.map(friend => (

            <div
              key={friend.id}
              className={`chat-user ${
                selectedFriend?.id === friend.id
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setSelectedFriend(friend)
              }
            >

              <div className="friend-name">
                {friend.profileImage ? (
                  <img 
                    src={friend.profileImage} 
                    alt={friend.userName}
                    className="friend-profile-image"
                  />
                ) : (
                  <div className="friend-profile-image-placeholder">
                    {friend.userName.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {friend.userName}
              </div>

            </div>
          ))}

        </div>

      </div>

      {/* MAIN */}

      <div className="chat-main">

        {!selectedFriend ? (

          <div className="empty-chat">

            <h2>Select a friend</h2>

          </div>

        ) : (

          <>

            {/* HEADER */}

            <div className="chat-header">

              <div className="chat-friend-name">
                {selectedFriend.userName}
              </div>

              <button
                className="menu-button"
                onClick={() =>
                  setShowChatMenu(prev => !prev)
                }
              >
                ⋮
              </button>

              {showChatMenu && (

                <div className="chat-menu">

                  <div
                    className="chat-menu-item danger"
                    onClick={handleBlockUser}
                  >
                    Block
                  </div>

                </div>
              )}

            </div>

            {/* MESSAGES */}

            <div className="chat-messages">

              {filteredChat.map(msg => {

                const isMe =
                  String(msg.fromUserId)
                  === String(userId);

                const replyMessage =
                  findReplyMessage(
                    msg.replyToMessageId
                  );

                return (

                  <div
                    key={msg.messageId}
                    className={`message-row ${
                      isMe ? "me" : "other"
                    }`}
                  >
                    <div className="message-bubble">

                      {/* REPLY PREVIEW */}

                      {replyMessage && (

                        <div className="reply-preview">

                          {replyMessage.message}

                        </div>
                      )}

                      {/* MESSAGE */}

                      {
                          msg.deletedForEveryone ? (
                          <span
                              style={{
                                  fontStyle: "italic",
                                  color: "#888"
                              }}
                          >
                              This message was deleted
                          </span>
                      ) : msg.type === "share_post" ? (

                          <div className="shared-post-card">

                              <div className="shared-post-header">
                                  Shared a post
                              </div>

                              <div className="shared-post-title">
                                  {msg.postTitle}
                              </div>

                              {
                                  msg.postImage && (
                                      <img
                                          src={msg.postImage}
                                          alt={msg.postTitle}
                                          className="shared-post-image"
                                      />
                                  )
                              }

                              <button
                                  onClick={() =>
                                      window.location.href =
                                          `/post/${msg.postId}`
                                  }
                              >
                                  View Post
                              </button>

                          </div>

                      ) : (
                          msg.message
                      )
                      }

                      {/* ACTIONS */}

                      <div className="message-actions">

                          {
                            !msg.deletedForEveryone && (
                              <>
                                <button
                                  onClick={() =>
                                    setReplyingTo(msg)
                                  }
                                >
                                  <MdReply />
                                </button>

                                <button
                                  onClick={() =>
                                    toggleStar(msg)
                                  }
                                >
                                  {msg.starred ? "⭐" : "☆"}
                                </button>
                              </>
                            )
                          }

                          {
                            isMe && !msg.deletedForEveryone && (

                              <button
                                onClick={() => deleteForEveryone(msg)}
                              >
                                <FaTrashAlt />
                              </button>

                            )
                          }

                        </div>

                    </div>

                  </div>
                );
              })}

              <div ref={messagesEndRef} />

            </div>

            {/* REPLY BAR */}

            {replyingTo && (

              <div className="replying-bar">

                Replying to:
                {" "}
                {replyingTo.message}

                <button
                  onClick={() =>
                    setReplyingTo(null)
                  }
                >
                  ✕
                </button>

              </div>
            )}

            
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