import Login from "./Login";
import Signup from "./Signup";

function AuthPage() {
  return (
    <div style={{ display: "flex", justifyContent: "space-around" }}>
      <div>
        <Login />
      </div>
      <div>
        <Signup />
      </div>
    </div>
  );
}

export default AuthPage;