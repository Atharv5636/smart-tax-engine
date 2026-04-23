import { Navigate, useLocation } from "react-router-dom";

function hasAuthToken() {
  if (typeof window === "undefined") {
    return false;
  }

  const token = window.localStorage.getItem("token");
  return Boolean(token);
}

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
