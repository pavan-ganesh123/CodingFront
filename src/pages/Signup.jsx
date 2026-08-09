import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../notifications/ToastContext";
import { UserCircle, Mail, Lock } from "lucide-react";
import { Field, Button } from "./AuthFormElements";
import "./AuthPage.css";

function Signup({ onSwitchToLogin }) {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      const res = await fetch("https://codecache-13ic.onrender.com/graphql", {
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
      showToast("Unable to connect to server. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSignup();
  };

  return (
    <>
      <h2 className="auth-heading">Create Account</h2>
      <p className="auth-subheading">One step away..</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Field
          label="Username"
          name="userName"
          autoComplete="username"
          icon={<UserCircle size={18} />}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />

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
          autoComplete="new-password"
          icon={<Lock size={18} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button loading={loading}>Create Account</Button>
      </form>

      <p className="auth-footer">
        Already have an account?{" "}
        <button type="button" className="text-link" onClick={onSwitchToLogin}>
          Log in
        </button>
      </p>
    </>
  );
}

export default Signup;
