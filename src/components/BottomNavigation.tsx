import { Home, List, Armchair, User, ConciergeBell } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: List, label: "Orders", path: "/orders" },
  // Placeholder for the central button gap
  null,
  { icon: Armchair, label: "Tables", path: "/tables" },
  { icon: User, label: "Profile", path: "/profile" },
];

export const BottomNavigation = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800">
      <div className="relative h-full">
        {/* Central Floating Button */}
        <NavLink
          to="/menu"
          className="absolute left-1/2 -top-1/2 transform -translate-x-1/2 w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <ConciergeBell className="h-8 w-8 text-white" />
        </NavLink>

        {/* Navigation Items Container */}
        <div className="flex justify-around items-center h-full px-2">
          {navItems.map((item, index) => {
            if (!item) {
              // This div creates the space in the middle
              return <div key={index} className="w-16" />;
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-center gap-2 text-gray-400 hover:text-white font-medium transition-all duration-300 py-2 px-4",
                    isActive
                      ? "bg-gray-700 text-primary rounded-full"
                      : "bg-transparent"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
