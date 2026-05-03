
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Menu from "@/pages/Menu";
import Orders from "@/pages/Orders";
import Tables from "@/pages/Tables";
import AllDishes from "@/pages/AllDishes";
import AllOrders from "@/pages/AllOrders";
import OverallPerformance from "@/pages/OverallPerformance";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/Profile";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import { useAuth } from "@/hooks/useAuth";
import PublicRoute from "./components/PublicRoute";
import { Toaster } from "sonner";
import ForgotPasswordNew from "./pages/ForgetPasswordNew";



const HomeRedirect = () => {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? "/dashboard" : "/menu"} replace />;
};

export default function App() {
  return (
    <Router>
     {/* <Toaster /> */}
     <Toaster richColors position="bottom-right" />
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPasswordNew />} />
        </Route>

        {/* Private routes */}
        <Route path="/" element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route index element={<HomeRedirect />} />
            <Route element={<AdminRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="all-dishes" element={<AllDishes />} />
              <Route path="all-orders" element={<AllOrders />} />
              <Route path="overall-performance" element={<OverallPerformance />} />
            </Route>
            <Route path="menu" element={<Menu />} />
            <Route path="orders" element={<Orders />} />
            <Route path="tables" element={<Tables />} />
            <Route path="profile" element={<Profile />} />
            <Route path="/forget-password-new" element={<ForgotPasswordNew />} />
          </Route>
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

