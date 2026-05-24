/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import Toast from "./Toast";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "",
  });

  const showToast = (message, type = "success") => {

    setToast({
      show: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "",
      });
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>

      {children}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
        />
      )}

    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);