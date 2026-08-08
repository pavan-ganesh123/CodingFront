/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useRef, useCallback } from "react";
import Toast from "./Toast";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Tracks the pending auto-hide timer so a new toast can cancel it —
  // without this, calling showToast() twice quickly means the first
  // timer can fire later and hide the *second* toast mid-display.
  const timeoutRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast({
      show: false,
      message: "",
      type: "",
    });
  }, []);

  const showToast = useCallback((message, type = "success") => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({
      show: true,
      message,
      type,
    });

    timeoutRef.current = setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "",
      });
      timeoutRef.current = null;
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>

      {children}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
