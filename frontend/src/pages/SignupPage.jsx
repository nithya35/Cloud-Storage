import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "../utils/axios";
import { useNavigate, Link } from "react-router-dom";
import './SignupPage.css';

const Signup = () => {
  const [name, setName] = useState("");
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
      const res = await axios.post("/users/signup", {
        name,
        email,
        password
      });

      if (res.data.status === "success") {
        setSuccessMsg("Signup successful!");
        setTimeout(() => navigate("/login"), 1000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="login-container">
      <h2>Create your account</h2>

      {errorMsg && <p className="error-message">{errorMsg}</p>}
      {successMsg && <p className="success-message">{successMsg}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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

        <button type="submit">Sign up</button>
      </form>

      <div className="footer">
        <p>Already have an account? <Link to="/login" className="link">Login</Link></p>
      </div>
    </div>
  );
};

export default Signup;
