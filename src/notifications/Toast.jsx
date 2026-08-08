import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";
import "./toast.css";

const ICONS = {
  success: FaCheckCircle,
  error: FaExclamationCircle,
  info: FaInfoCircle,
};

function Toast({ message, type, onClose }) {
  const Icon = ICONS[type] || FaInfoCircle;

  return (
    <div className={`tst-toast tst-toast--${type || "info"}`} role="status">
      <Icon className="tst-icon" aria-hidden="true" />
      <span className="tst-message">{message}</span>
      <button className="tst-close" onClick={onClose} aria-label="Dismiss">
        <FaTimes />
      </button>
    </div>
  );
}

export default Toast;
