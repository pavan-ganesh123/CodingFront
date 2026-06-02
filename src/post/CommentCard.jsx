import React from "react";
import "./CommentCard.css";

const CommentCard = ({ comment }) => {

    const formatDate = (dateString) => {

        if (!dateString) return "";

        return new Date(dateString)
            .toLocaleString();
    };

    return (
        <div className="comment-card">

            <div className="comment-header">

                <div className="comment-avatar">
                    {comment.username?.charAt(0)?.toUpperCase()}
                </div>

                <div>

                    <div className="comment-username">
                        {comment.username}
                    </div>

                    <div className="comment-time">
                        {formatDate(comment.createdAt)}
                    </div>

                </div>

            </div>

            <div className="comment-body">
                {comment.comment}
            </div>

        </div>
    );
};

export default CommentCard;