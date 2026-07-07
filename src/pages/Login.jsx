import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../notifications/ToastContext";
import "./Login.css";
import { Eye, EyeOff } from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const handleLogin = async () => {
    const query = `
        mutation ($email: String!, $password: String!) {
            login(email: $email, password: $password) {
            token
            }
        }
        `;

    const res = await fetch("http://localhost:8080/graphql", {
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
      navigate("/home");   // ✅ go to home
    } else {
      showToast("Invalid Credentials!", "error");
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Welcome Back</h2>

      <p className="login-subtitle">
        Login to continue to Code Cache.
      </p>

      <div className="login-form">
        <input
          className="login-input"
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="password-wrapper">
          <input
            className="login-input"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          className="login-button"
          onClick={handleLogin}
        >
          Log In
        </button>

      </div>
    </div>
  );
}

export default Login;