import { useState } from "react";
import axios from "../utils/axios";
import { useNavigate, Link } from "react-router-dom";
import './LoginPage.css';
import { FaEye, FaEyeSlash } from "react-icons/fa"

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await axios.post("/users/login", {
        email,
        password,
      });

      if (res.data.status === "success") {
        setSuccessMsg("Login successful!");
        setTimeout(() => navigate("/"), 1000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-container">
      <h2>Sign in to your account</h2>

      {errorMsg && <p className="error-message">{errorMsg}</p>}
      {successMsg && <p className="success-message">{successMsg}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="options">
          <Link to="/forgot-password" className="link">Forgot password?</Link>
        </div>

        <button type="submit">Login</button>
      </form>

      <div className="footer">
        <p>Don't have an account? <Link to="/signup" className="link">Sign up</Link></p>
      </div>
    </div>
  );
};

export default Login;
