import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
      console.log("Login successful!");
      navigate("/home");   // ✅ go to home
    } else {
      console.log("Invalid credentials");
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