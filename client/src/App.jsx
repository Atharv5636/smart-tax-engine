import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import CapitalGainsPage from "./pages/CapitalGainsPage";
import ChatAssistant from "./pages/ChatAssistant";
import DashboardPage from "./pages/DashboardPage";
import GoalPage from "./pages/GoalPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import OptimizePage from "./pages/OptimizePage";
import SalaryPage from "./pages/SalaryPage";
import SimulationPage from "./pages/SimulationPage";
import SignupPage from "./pages/SignupPage";
import TaxPage from "./pages/TaxPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        element={(
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        )}
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tax" element={<TaxPage />} />
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="/optimize" element={<OptimizePage />} />
        <Route path="/goal" element={<GoalPage />} />
        <Route path="/salary" element={<SalaryPage />} />
        <Route path="/capital-gains" element={<CapitalGainsPage />} />
        <Route path="/chat-assistant" element={<ChatAssistant />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
