// components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import loginService from "/api/loginService";

const ProtectedRoute = () => {
  const isAuthenticated = loginService.isAuthenticated();
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
