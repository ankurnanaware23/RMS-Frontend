import { User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout, useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Header = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isAdmin } = useAuth();

  const fetchUserData = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        setIsAuthenticated(true);
        const response = await fetch("/api/user/profile/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (response.status === 401) {
          logout();
          navigate("/signin");
          toast("Your session has expired. Please log in again. 🔑");
          return;
        }
        if (response.ok) {
          const data = await response.json();
          setUserName(`${data.first_name} ${data.last_name}`);
        } else {
          console.error("Failed to fetch user data");
        }
      }
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  useEffect(() => {
    fetchUserData();

    const handleProfileUpdated = () => fetchUserData();

    window.addEventListener('profileUpdated', handleProfileUpdated);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdated);
    };
  }, []);

  return (
    <header className="bg-background border-b border-border p-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-foreground">
              <span className="text-primary mr-2">🛎️</span> DineEase
            </div>
          </div>
        </Link>

        {/* Right Side */}
        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="text-sm">
                <div className="font-medium">{userName}</div>
                <div className="text-muted-foreground text-xs">
                  {isAdmin ? "Admin" : "Staff"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
