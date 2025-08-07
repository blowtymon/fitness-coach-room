import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const HomeRoute = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/chat" /> : <Navigate to="/signin" />;
};
