import "./Friends.css"; // adjust path if needed
import { getUserFromToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import { useFriends } from "../hooks/useFriends";

function FriendsChat() {

  const user = getUserFromToken();
  const userId = user?.userId;

  const {
    data: friends = []
  } = useFriends(userId);

    const navigate = useNavigate();

    const openChat = (friend) => {
    navigate(`/friends/chat/${friend.id}`, {
        state: { friend }
    });
    };

  return (
    <div className="friends-container">
      <h2>Your Friends</h2>

      {friends.length === 0 ? (
        <p className="empty">No friends yet</p>
      ) : (
        friends.map(friend => (
          <div
            key={friend.id}
            className="friend-card clickable"
            onClick={() => openChat(friend)}
          >
            {friend.userName}
          </div>
        ))
      )}
    </div>
  );
}

export default FriendsChat;