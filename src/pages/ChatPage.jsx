/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef, useState } from "react";
import { gql } from "graphql-request";

import { getClient } from "../api/graphqlClient";
import { getUserFromToken } from "../utils/auth";
import {
  FaTrashAlt,
  FaStar,
  FaRegStar,
  FaEllipsisV,
  FaTimes,
  FaPaperPlane,
  FaArrowLeft,
  FaComments,
} from "react-icons/fa";
import { MdReply } from "react-icons/md";
import "./ChatPage.css";
import { useWebSocket } from "../context/WebSocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { useFriends } from "../hooks/useFriends";

const AVATAR_ACCENTS = ["primary", "teal", "rose"];

function accentFor(name) {
  const code = (name || "?").charCodeAt(0) || 0;
  return AVATAR_ACCENTS[code % AVATAR_ACCENTS.length];
}

function ChatPage() {
  const queryClient = useQueryClient();
  const [selectedFriend, setSelectedFriend] = useState(null);

  const [message, setMessage] = useState("");

  const [chat, setChat] = useState([]);

  const [replyingTo, setReplyingTo] = useState(null);

  const [showChatMenu, setShowChatMenu] = useState(false);

  const [showSidebarMenu, setShowSidebarMenu] = useState(false);

  // 🔹 New: profile picture zoom — holds the person currently shown in
  // the lightbox, or null when closed.
  const [zoomedProfile, setZoomedProfile] = useState(null);

  const messagesEndRef = useRef(null);

  const user = getUserFromToken();

  const userId = user?.userId;

  const client = getClient();
  const socketRef = useWebSocket();
  // =====================================================
  // GRAPHQL
  // =====================================================
  const { data: friends = [] } = useFriends(userId);

  const GET_MESSAGES = gql`
    query($senderId: ID!, $receiverId: ID!) {
      messages(senderId: $senderId, receiverId: $receiverId) {
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
      blockUser(userId: $userId, targetUserId: $targetUserId) {
        id
      }
    }
  `;

  // =====================================================
  // FETCH SAVED MESSAGES
  // =====================================================

  useEffect(() => {
    if (!selectedFriend) return;

    fetchMessages();
  }, [selectedFriend]);

  const fetchMessages = async () => {
    try {
      const data = await client.request(GET_MESSAGES, {
        senderId: Number(userId),
        receiverId: Number(selectedFriend.id),
      });

      const formatted = data.messages.map((msg) => ({
        type: msg.messageType === "POST_SHARE" ? "share_post" : "private",

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
        createdAt: msg.createdAt,
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

      if (msg.type === "private" || msg.type === "share_post") {
        setChat((prev) => {
          // Replace the optimistic temp entry once the server confirms it,
          // instead of appending a second copy
          const tempIndex = prev.findIndex(
            (m) =>
              typeof m.messageId === "string" &&
              m.messageId.startsWith("temp-") &&
              String(m.fromUserId) === String(msg.fromUserId) &&
              String(m.to) === String(msg.to) &&
              m.message === msg.message
          );

          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = msg;
            return updated;
          }

          const exists = prev.some((m) => m.messageId === msg.messageId);
          if (exists) return prev;

          return [...prev, msg];
        });
      }

      if (msg.type === "delete") {
        setChat((prev) =>
          prev.map((m) =>
            m.messageId === msg.messageId ? { ...m, deletedForEveryone: true } : m
          )
        );
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socketRef]);

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = () => {
    if (!selectedFriend) return;
    if (!message.trim()) return;
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.log("WebSocket not connected");
      return;
    }

    const tempId = `temp-${Date.now()}`;

    const payload = {
      type: "private",
      to: String(selectedFriend.id),
      message,
      replyToMessageId: replyingTo?.messageId || null,
    };

    socketRef.current.send(JSON.stringify(payload));

    // Optimistically add to local state so the sender sees it immediately
    setChat((prev) => [
      ...prev,
      {
        type: "private",
        messageId: tempId,
        fromUserId: String(userId),
        to: String(selectedFriend.id),
        message,
        replyToMessageId: replyingTo?.messageId || null,
        starred: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    setMessage("");
    setReplyingTo(null);
  };

  const deleteForEveryone = (msg) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "delete",
        messageId: msg.messageId,
        to: msg.to,
      })
    );

    // Update locally right away instead of waiting on a socket echo
    // that may never be sent back to this same connection
    setChat((prev) =>
      prev.map((m) => (m.messageId === msg.messageId ? { ...m, deletedForEveryone: true } : m))
    );
  };

  // =====================================================
  // FILTER CHAT
  // =====================================================

  const filteredChat = useMemo(() => {
    if (!selectedFriend) return [];

    return chat.filter((msg) => {
      const sentByMe =
        String(msg.fromUserId) === String(userId) && String(msg.to) === String(selectedFriend.id);

      const receivedFromFriend = String(msg.fromUserId) === String(selectedFriend.id);

      return sentByMe || receivedFromFriend;
    });
  }, [chat, selectedFriend, userId]);

  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
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
        await client.request(UNSTAR_MESSAGE, {
          messageId: msg.messageId,
        });
      } else {
        await client.request(STAR_MESSAGE, {
          messageId: msg.messageId,
        });
      }

      setChat((prev) =>
        prev.map((m) =>
          m.messageId === msg.messageId ? { ...m, starred: !m.starred } : m
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

    const confirmBlock = window.confirm(`Block ${selectedFriend.userName}?`);

    if (!confirmBlock) return;

    try {
      await client.request(BLOCK_USER, {
        userId,
        targetUserId: selectedFriend.id,
      });

      queryClient.setQueryData(["friends", userId], (oldFriends = []) =>
        oldFriends.filter((f) => String(f.id) !== String(selectedFriend.id))
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
    return chat.find((m) => m.messageId === replyId);
  };

  // =====================================================
  // PROFILE ZOOM — new. Opens a lightbox for the given person; closes
  // on Escape, backdrop click, or the close button.
  // =====================================================

  const openProfileZoom = (person, e) => {
    e?.stopPropagation();
    setZoomedProfile(person);
  };

  const closeProfileZoom = () => setZoomedProfile(null);

  useEffect(() => {
    if (!zoomedProfile) return;

    const handleKey = (e) => {
      if (e.key === "Escape") closeProfileZoom();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [zoomedProfile]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className={`cp-layout ${selectedFriend ? "cp-has-selection" : ""}`}>
      {/* SIDEBAR */}

      <div className="cp-sidebar">
        <div className="cp-sidebar-header">
          <span className="cp-sidebar-title">Messages</span>

          <div className="cp-menu-wrap">
            <button
              className="cp-icon-btn"
              onClick={() => setShowSidebarMenu((prev) => !prev)}
              aria-label="More options"
            >
              <FaEllipsisV />
            </button>

            {showSidebarMenu && (
              <div className="cp-dropdown">
                <button
                  className="cp-dropdown-item"
                  onClick={() => {
                    window.location.href = "/blocked-users";
                  }}
                >
                  Blocked Users
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="cp-friends-list">
          {friends.map((friend) => (
            <button
              key={friend.id}
              className={`cp-friend ${selectedFriend?.id === friend.id ? "cp-is-selected" : ""}`}
              onClick={() => setSelectedFriend(friend)}
            >
              <span
                className="cp-avatar-btn"
                role="button"
                tabIndex={0}
                aria-label={`View ${friend.userName}'s photo`}
                onClick={(e) => openProfileZoom(friend, e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openProfileZoom(friend, e);
                }}
              >
                {friend.profileImage ? (
                  <img src={friend.profileImage} alt={friend.userName} className="cp-avatar-img" />
                ) : (
                  <span className={`cp-avatar-placeholder cp-avatar--${accentFor(friend.userName)}`}>
                    {friend.userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>

              <span className="cp-friend-name">{friend.userName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN */}

      <div className="cp-main">
        {!selectedFriend ? (
          <div className="cp-empty">
            <FaComments className="cp-empty-icon" />
            <p className="cp-empty-title">Select a friend</p>
            <p className="cp-empty-copy">Pick someone from the list to start chatting.</p>
          </div>
        ) : (
          <>
            {/* HEADER */}

            <div className="cp-chat-header">
              <button className="cp-header-back" onClick={() => setSelectedFriend(null)} aria-label="Back to friends">
                <FaArrowLeft />
              </button>

              <span
                className="cp-avatar-btn cp-avatar-btn--md"
                role="button"
                tabIndex={0}
                aria-label={`View ${selectedFriend.userName}'s photo`}
                onClick={(e) => openProfileZoom(selectedFriend, e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openProfileZoom(selectedFriend, e);
                }}
              >
                {selectedFriend.profileImage ? (
                  <img
                    src={selectedFriend.profileImage}
                    alt={selectedFriend.userName}
                    className="cp-avatar-img"
                  />
                ) : (
                  <span className={`cp-avatar-placeholder cp-avatar--${accentFor(selectedFriend.userName)}`}>
                    {selectedFriend.userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>

              <span className="cp-chat-friend-name">{selectedFriend.userName}</span>

              <div className="cp-menu-wrap cp-menu-wrap--end">
                <button
                  className="cp-icon-btn"
                  onClick={() => setShowChatMenu((prev) => !prev)}
                  aria-label="Chat options"
                >
                  <FaEllipsisV />
                </button>

                {showChatMenu && (
                  <div className="cp-dropdown cp-dropdown--right">
                    <button className="cp-dropdown-item cp-dropdown-item--danger" onClick={handleBlockUser}>
                      Block
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* MESSAGES */}

            <div className="cp-messages">
              {filteredChat.map((msg) => {
                const isMe = String(msg.fromUserId) === String(userId);

                const replyMessage = findReplyMessage(msg.replyToMessageId);

                return (
                  <div key={msg.messageId} className={`cp-message-row ${isMe ? "cp-me" : "cp-other"}`}>
                    <div className="cp-message-bubble">
                      {/* REPLY PREVIEW */}

                      {replyMessage && <div className="cp-reply-preview">{replyMessage.message}</div>}

                      {/* MESSAGE */}

                      {msg.deletedForEveryone ? (
                        <span className="cp-deleted-text">This message was deleted</span>
                      ) : msg.type === "share_post" ? (
                        <div className="cp-shared-post">
                          <div className="cp-shared-post-header">Shared a post</div>
                          <div className="cp-shared-post-title">{msg.postTitle}</div>

                          {msg.postImage && (
                            <img src={msg.postImage} alt={msg.postTitle} className="cp-shared-post-image" />
                          )}

                          <button
                            className="cp-shared-post-btn"
                            onClick={() => (window.location.href = `/post/${msg.postId}`)}
                          >
                            View Post
                          </button>
                        </div>
                      ) : (
                        <span className="cp-message-text">{msg.message}</span>
                      )}

                      {/* ACTIONS */}

                      <div className="cp-message-actions">
                        {!msg.deletedForEveryone && (
                          <>
                            <button onClick={() => setReplyingTo(msg)} aria-label="Reply">
                              <MdReply />
                            </button>

                            <button onClick={() => toggleStar(msg)} aria-label="Star">
                              {msg.starred ? <FaStar className="cp-star-filled" /> : <FaRegStar />}
                            </button>
                          </>
                        )}

                        {isMe && !msg.deletedForEveryone && (
                          <button onClick={() => deleteForEveryone(msg)} aria-label="Delete for everyone">
                            <FaTrashAlt />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* REPLY BAR */}

            {replyingTo && (
              <div className="cp-replying-bar">
                <span className="cp-replying-label">Replying to</span>
                <span className="cp-replying-text">{replyingTo.message}</span>
                <button onClick={() => setReplyingTo(null)} aria-label="Cancel reply">
                  <FaTimes />
                </button>
              </div>
            )}

            {/* INPUT */}

            <div className="cp-input-area">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="cp-input"
              />

              <button className="cp-send-btn" onClick={sendMessage} aria-label="Send message">
                <FaPaperPlane />
              </button>
            </div>
          </>
        )}
      </div>

      {/* PROFILE ZOOM LIGHTBOX — new feature */}

      {zoomedProfile && (
        <div className="cp-lightbox" onClick={closeProfileZoom}>
          <div className="cp-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="cp-lightbox-close" onClick={closeProfileZoom} aria-label="Close">
              <FaTimes />
            </button>

            {zoomedProfile.profileImage ? (
              <img src={zoomedProfile.profileImage} alt={zoomedProfile.userName} className="cp-lightbox-img" />
            ) : (
              <span className={`cp-lightbox-placeholder cp-avatar--${accentFor(zoomedProfile.userName)}`}>
                {zoomedProfile.userName.charAt(0).toUpperCase()}
              </span>
            )}

            <p className="cp-lightbox-name">{zoomedProfile.userName}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
