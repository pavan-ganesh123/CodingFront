import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastProvider, useToast } from "../notifications/ToastContext";
import "./Signup.css";
import { Eye, EyeOff } from "lucide-react";

function Signup() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const handleSignup = async () => {
    const query = `
      mutation AddUser($userName: String!, $email: String!, $password: String!) {
        addUser(userName: $userName, email: $email, password: $password) {
          id
          userName
          email
        }
      }
    `;

    const variables = {
      userName,
      email,
      password,
    };

    try {
      const res = await fetch("http://localhost:8080/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const data = await res.json();

    

      // Check for GraphQL errors (even if HTTP status is 200)
      if (data.errors && data.errors.length > 0) {
        const errorMsg = data.errors[0]?.message || "Signup failed";

        console.error("GraphQL error:", errorMsg);

        showToast(errorMsg, "error");
        return;
      }

      // Successful signup
      if (data.data?.addUser) {
        showToast("Signup successful!", "success");

        // optional: clear fields
        setUserName("");
        setEmail("");
        setPassword("");

        navigate("/");
        return;
      }

      showToast("Signup failed. Please try again.", "error");

    } catch (err) {
      console.error("Network error:", err);
      showToast(
        "Unable to connect to server. Please try again.",
        "error"
      );
    }
  };

  return (
      <div className="signup-container">
          <h2 className="signup-title">Create Account</h2>

          <p className="signup-subtitle">
              One step away..
          </p>

          <div className="signup-form">
              <input
                  className="signup-input"
                  type="text"
                  placeholder="Username"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
              />

              <input
                  className="signup-input"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
              />
              <div className="password-wrapper">
                <input
                  className="signup-input"
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
                  className="signup-button"
                  onClick={handleSignup}
              >
                  Create Account
              </button>
          </div>
      </div>
  );
}

export default Signup;