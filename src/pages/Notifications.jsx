import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBellSlash,
  FaCheckDouble,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
  FaTrash,
  FaTrashAlt,
} from "react-icons/fa";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "./notificationApi";
import { fetchPublicProfiles } from "./userApi";
import "./Notifications.css";

const PAGE_SIZE = 15;

// Each type maps to a short, namespaced log-style tag (echoes the
// post-activity / friend-activity Kafka topics under the hood),
// the accent it renders in, and the sentence fragment after the sender.
const TYPE_META = {
  POST_LIKE: { tag: "post.like", accent: "--notif-like", text: "liked your post" },
  COMMENT_LIKE: { tag: "comment.like", accent: "--notif-like", text: "liked your comment" },
  POST_COMMENT: { tag: "post.comment", accent: "--notif-comment", text: "commented on your post" },
  POST_SHARE: { tag: "post.share", accent: "--notif-share", text: "shared your post" },
  FRIEND_REQUEST: { tag: "friend.req", accent: "--notif-friend", text: "sent you a friend request" },
  FRIEND_ACCEPTED: { tag: "friend.ok", accent: "--notif-friend", text: "accepted your friend request" },
  MESSAGE: { tag: "message", accent: "--notif-message", text: "sent you a message" },
  MENTION: { tag: "mention", accent: "--notif-mention", text: "mentioned you" },
  SYSTEM: { tag: "system", accent: "--notif-system", text: "" },
};
const DEFAULT_META = { tag: "event", accent: "--notif-system", text: "sent you a notification" };

function formatRelativeTime(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// referenceId holds different things per type (see NotificationService):
// postId for POST_LIKE/POST_COMMENT, but a chat messageId for POST_SHARE
// (a "share" is a message that links to the post) — so POST_SHARE routes
// to /chat, not /post/:id.
function routeFor(notification) {
  const { type, referenceId } = notification;
  if (type === "MESSAGE" || type === "POST_SHARE") return "/chat";
  if (type === "FRIEND_REQUEST" || type === "FRIEND_ACCEPTED") return "/friends";
  if ((type === "POST_LIKE" || type === "POST_COMMENT") && referenceId) {
    return `/post/${referenceId}`;
  }
  return null;
}

function NotificationRow({ notification, index, profile, onRead, onDelete, onNavigate }) {
  const meta = TYPE_META[notification.type] ?? DEFAULT_META;
  const isSystem = notification.type === "SYSTEM";
  const displayName = profile?.userName
    ?? (notification.senderId != null ? `User #${notification.senderId}` : "Someone");
  const sentence = isSystem ? "System notification" : `${displayName} ${meta.text}`;
  const initial = displayName.charAt(0).toUpperCase();

  const handleActivate = () => {
    if (!notification.read) onRead(notification.id);
    const route = routeFor(notification);
    if (route) onNavigate(route);
  };

  return (
    <div
      className={`notif-row ${notification.read ? "" : "is-unread"}`}
      style={{ "--accent": `var(${meta.accent})`, "--i": index }}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      }}
    >
      <span className="notif-avatar" aria-hidden="true">
        {isSystem ? (
          <FaInfoCircle className="notif-avatar-icon" />
        ) : profile?.profilePicture ? (
          <img src={profile.profilePicture} alt="" />
        ) : (
          <span className="notif-avatar-fallback">{initial}</span>
        )}
      </span>

      <div className="notif-row-body">
        <span className="notif-tag">{meta.tag}</span>
        <p className="notif-row-text">{sentence}</p>
      </div>

      <span className="notif-row-time">{formatRelativeTime(notification.createdAt)}</span>

      <button
        type="button"
        className="notif-row-delete"
        aria-label="Delete notification"
        title="Delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
      >
        <FaTrashAlt />
      </button>
    </div>
  );
}

function Notifications() {
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [profiles, setProfiles] = useState(new Map());
  const knownSenderIds = useRef(new Set());

  const notifications = pageData?.content ?? [];

  // Stable key that only changes when the actual set of senders on this
  // page changes — not on every read/delete toggle, which replaces the
  // pageData object but not who's in it. Depending the enrichment effect
  // on this instead of pageData stops it from restarting (and cancelling)
  // in-flight profile fetches every time a row gets marked read.
  const senderIdsKey = [...new Set(notifications.map((n) => n.senderId).filter((id) => id != null))]
    .sort((a, b) => a - b)
    .join(",");

  const load = useCallback((targetPage) => {
    setStatus("loading");
    fetchNotifications(targetPage, PAGE_SIZE)
      .then((data) => {
        setPageData(data);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Failed to load notifications:", err);
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  // Enrich the current page with sender name/avatar. Only caches an id
  // once its fetch actually succeeds, so a genuine failure gets retried
  // next time this key changes rather than being stuck forever.
  useEffect(() => {
    const missing = senderIdsKey
      ? senderIdsKey.split(",").map(Number).filter((id) => !knownSenderIds.current.has(id))
      : [];
    if (missing.length === 0) return;

    let cancelled = false;
    fetchPublicProfiles(missing).then((fetched) => {
      if (cancelled) return;

      fetched.forEach((prof, id) => {
        if (prof) knownSenderIds.current.add(id);
      });

      setProfiles((current) => {
        const next = new Map(current);
        fetched.forEach((prof, id) => {
          if (prof) next.set(id, prof);
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [senderIdsKey]);

  const handleRead = (id) => {
    setPageData((prev) => prev && {
      ...prev,
      content: prev.content.map((n) => (n.id === id ? { ...n, read: true } : n)),
    });
    markAsRead(id).catch((err) => {
      console.error("Failed to mark notification as read:", err);
      load(page);
    });
  };

  const handleDelete = (id) => {
    setPageData((prev) => prev && {
      ...prev,
      content: prev.content.filter((n) => n.id !== id),
    });
    deleteNotification(id).catch((err) => {
      console.error("Failed to delete notification:", err);
      load(page);
    });
  };

  const handleMarkAllRead = () => {
    setPageData((prev) => prev && {
      ...prev,
      content: prev.content.map((n) => ({ ...n, read: true })),
    });
    markAllAsRead().catch((err) => {
      console.error("Failed to mark all as read:", err);
      load(page);
    });
  };

  const handleDeleteAll = () => {
    if (!window.confirm("Clear every notification? This can't be undone.")) return;
    setPageData({ content: [], totalPages: 1, number: 0, first: true, last: true });
    deleteAllNotifications().catch((err) => {
      console.error("Failed to clear notifications:", err);
      load(page);
    });
  };

  const hasUnread = notifications.some((n) => !n.read);
  const hasAny = notifications.length > 0;

  return (
    <div className="notif-page">
      <div className="notif-mesh" aria-hidden="true" />
      <div className="notif-grain" aria-hidden="true" />

      <div className="notif-shell">
        <header className="notif-header">
          <div>
            <span className="notif-kicker">
              <span className="notif-chevron">$</span> tail -f notifications.log
            </span>
            <h1 className="notif-heading">Notifications</h1>
          </div>
          <div className="notif-actions">
            <button type="button" className="notif-btn" onClick={handleMarkAllRead} disabled={!hasUnread}>
              <FaCheckDouble /> Mark all read
            </button>
            <button type="button" className="notif-btn notif-btn-danger" onClick={handleDeleteAll} disabled={!hasAny}>
              <FaTrash /> Clear all
            </button>
          </div>
        </header>

        <div className="notif-list-panel">
          {status === "loading" && (
            <p className="notif-status">
              fetching<span className="notif-cursor" aria-hidden="true" />
            </p>
          )}

          {status === "error" && (
            <div className="notif-status notif-status-error">
              <p>Couldn't reach the notification feed.</p>
              <button type="button" className="notif-btn" onClick={() => load(page)}>Retry</button>
            </div>
          )}

          {status === "ready" && !hasAny && (
            <div className="notif-empty">
              <FaBellSlash className="notif-empty-icon" aria-hidden="true" />
              <p>No notifications yet</p>
              <span>Solve a problem, add a friend, or start a chat — this feed fills up from there.</span>
            </div>
          )}

          {status === "ready" && hasAny && (
            <div className="notif-list">
              {notifications.map((n, i) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  index={i}
                  profile={profiles.get(n.senderId)}
                  onRead={handleRead}
                  onDelete={handleDelete}
                  onNavigate={navigate}
                />
              ))}
            </div>
          )}
        </div>

        {pageData && pageData.totalPages > 1 && (
          <div className="notif-pagination">
            <button
              type="button"
              className="notif-page-btn"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={pageData.first}
              aria-label="Previous page"
            >
              <FaChevronLeft />
            </button>
            <span className="notif-page-label">
              Page {pageData.number + 1} of {pageData.totalPages}
            </span>
            <button
              type="button"
              className="notif-page-btn"
              onClick={() => setPage((p) => p + 1)}
              disabled={pageData.last}
              aria-label="Next page"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
