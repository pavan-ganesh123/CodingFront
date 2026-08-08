import React from "react";
import "./CommentCard.css";
import { useUserAvatar } from "../hooks/useUserAvatar";

const AVATAR_ACCENTS = ["primary", "teal", "rose"];

function accentFor(name) {
    const code = (name || "?").charCodeAt(0) || 0;
    return AVATAR_ACCENTS[code % AVATAR_ACCENTS.length];
}

function timeAgo(dateString) {
    if (!dateString) return "";

    try {
        const date = new Date(dateString);
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d`;

        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
        return "";
    }
}

const CommentCard = ({ comment }) => {
    const profilePicture = useUserAvatar(comment.userId);

    return (
        <div className="cc-card">
            {profilePicture ? (
                <img src={profilePicture} alt={comment.username} className="cc-avatar-img" />
            ) : (
                <span className={`cc-avatar cc-avatar--${accentFor(comment.username)}`}>
                    {(comment.username || "?").charAt(0).toUpperCase()}
                </span>
            )}

            <div className="cc-body">
                <div className="cc-meta">
                    <span className="cc-username">{comment.username}</span>
                    <span className="cc-time" title={new Date(comment.createdAt).toLocaleString()}>
                        {timeAgo(comment.createdAt)}
                    </span>
                </div>

                <div className="cc-bubble">
                    <span className="cc-text">{comment.comment}</span>
                </div>
            </div>
        </div>
    );
};

export default CommentCard;
