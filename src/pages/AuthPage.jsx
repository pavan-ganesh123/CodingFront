import Login from "./Login";
import Signup from "./Signup";
import "./AuthPage.css";

function AuthPage() {
  return (
    <div className="auth-container">
      <div className="brand">
        <h2>Code Cache</h2>
        <p>Powering Your Code Journey</p>
      </div>
      <div className="glass-card">
        <Login />
      </div>
      <div className="glass-card">
        <Signup />
      </div>
    </div>
  );
}

export default AuthPage;