import { useState } from 'react';

// export const useAuth = () => {
//   // In a real application, you would fetch this from a secure source (e.g., local storage, a cookie, or an API call)
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   return { isAuthenticated, setIsAuthenticated };
// };


const parseJwt = (token: string | null) => {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const accessToken = localStorage.getItem("accessToken");
  const payload = parseJwt(accessToken);
  const isAdmin = Boolean(payload?.is_superuser || payload?.is_staff);

  return {
    isAuthenticated: !!accessToken,
    isAdmin,
  };
};

export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};
