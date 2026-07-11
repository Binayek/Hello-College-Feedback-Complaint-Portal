import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  // Wait until authentication status is known
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          color: "var(--text-muted)",
        }}
      >
        Loading...
      </div>
    );
  }

  // User already logged in checking and redirecting to their respective dashboard based on their role.{skips login for logged in users}
  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  // User not logged in
  return children;
}