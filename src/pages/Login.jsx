import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../notifications/ToastContext";
function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { showToast } = useToast();
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
    <div>
      <h2>Login</h2>

      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;