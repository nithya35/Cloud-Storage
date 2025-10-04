import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import './ResetPasswordPage.css';

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await axios.patch(`/users/resetPassword/${token}`, {
        password
      });

      if (res.data.status === "success") {
        setMessage("Password reset successful!");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed");
    }
  };

  return (
    <div className="login-container">
      <h2>Reset your password</h2>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <form onSubmit={handleSubmit}>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
};

export default ResetPassword;
