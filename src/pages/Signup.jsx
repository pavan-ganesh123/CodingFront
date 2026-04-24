import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
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

      console.log("Signup success:", data);

      if (data.data) {
        alert("Signup successful!");
        navigate("/");
      } else {
        alert("Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred");
    }
  };

  return (
    <div>
      <h2>Signup</h2>

      <input
        type="text"
        placeholder="Username"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleSignup}>Signup</button>
    </div>
  );
}

export default Signup;