import { useState } from "react";
import axios from "../utils/axios";
import "./ForgotPasswordPage.css";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("/users/forgotPassword", { email });

      if (res.data.status === "success") {
        setMessage("Password reset link sent to your email.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Request failed");
    }
  };

  return (
    <div className="forgot-container">
      <h2>Forgot Password</h2>

      {errorMsg && <p className="error">{errorMsg}</p>}
      {message && <p className="success">{message}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Reset Link</button>
      </form>

      <p className="switch-link">
        Remembered your password? <a href="/login">Login</a>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
