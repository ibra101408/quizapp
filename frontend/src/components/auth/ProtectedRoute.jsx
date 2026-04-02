import React from 'react';
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    // If no token, kick them back to login
    return <Navigate to="/Login" replace />;
  }

  // If token exists, show the protected page
  return children;
};

export default ProtectedRoute;