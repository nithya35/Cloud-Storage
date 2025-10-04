import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./pages/Dashboard";
import TrashPage from "./pages/Trash";
import StatsPage from "./pages/Stats";
import SharedPage from "./pages/Shared";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/shared-page/*" element={<SharedPage />} />
        <Route path="/*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;