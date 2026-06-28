// components/Logout.jsx
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { useToast } from "../notifications/ToastContext";

function Logout() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed")); // tells WebSocketProvider to disconnect
    showToast("Logged out successfully!", "success");
    navigate("/", { replace: true });
  };

  return (
    <FaSignOutAlt
      className="nav-icon"
      title="Logout"
      onClick={handleLogout}
    />
  );
}

export default Logout;