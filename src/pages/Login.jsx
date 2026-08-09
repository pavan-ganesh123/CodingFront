import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../notifications/ToastContext";
import { Mail, Lock } from "lucide-react";
import { Field, Button } from "./AuthFormElements";
import "./AuthPage.css";

function Login({ onSwitchToSignup }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const query = `
        mutation ($email: String!, $password: String!) {
            login(email: $email, password: $password) {
            token
            }
        }
        `;

      const res = await fetch("https://codecache-13ic.onrender.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { email, password },
        }),
      });

      const data = await res.json();

      if (data.data && data.data.login) {
        const token = data.data.login.token;
        localStorage.setItem("token", token);
        window.dispatchEvent(new Event("auth-changed"));
        showToast("Login Successful!", "success");
        navigate("/home"); // ✅ go to home
      } else {
        showToast("Invalid Credentials!", "error");
      }
    } catch (err) {
      console.error("Network error:", err);
      showToast("Unable to connect to server. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <>
      <h2 className="auth-heading">Welcome Back</h2>
      <p className="auth-subheading">Login to continue to Code Cache.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Field
          label="Email Address"
          type="email"
          name="email"
          autoComplete="email"
          icon={<Mail size={18} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          icon={<Lock size={18} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button loading={loading}>Log In</Button>
      </form>

      <p className="auth-footer">
        No account?{" "}
        <button type="button" className="text-link" onClick={onSwitchToSignup}>
          Sign up
        </button>
      </p>
    </>
  );
}

export default Login;
