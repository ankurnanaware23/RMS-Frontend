import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  EnvelopeOpenIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  EyeOpenIcon,
  EyeNoneIcon,
} from "@radix-ui/react-icons";
import api from "@/lib/api";

const ForgotPasswordNew = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
      handleEmailSubmit(null, location.state.email);
    }
  }, [location.state?.email]);

  const handleEmailSubmit = async (e: React.FormEvent | null, userEmail = email) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/user/password-reset/", { email: userEmail });
      toast.success("Password reset code sent to your email");
      setStep(2);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/user/otp-verification/", { email, otp });
      toast.success("OTP verified successfully");
      setStep(3);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/user/password-change/", {
        otp,
        email,
        password,
      });
      toast.success("Password changed successfully");
      navigate("/signin");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await api.post("/api/user/password-reset/", { email });
      toast.success("Password reset code sent to your email");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    if (name.length > 2) {
      return `${name.substring(0, 1)}*****@${domain}`;
    }
    return `${name}*****@${domain}`;
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen">
      <Link
        to="/signin"
        className="absolute top-8 left-8 flex items-center group"
      >
        <div className="flex items-center justify-center bg-yellow-400 group-hover:bg-yellow-500 rounded-full w-10 h-10 transition-colors duration-300">
          <ArrowLeftIcon className="h-6 w-6 text-black" />
        </div>
        <span className="ml-3 text-yellow-400 group-hover:text-yellow-500 font-semibold text-lg transition-colors duration-300">
          Back to signin
        </span>
      </Link>
      <Card className="w-full max-w-sm">
        {step === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <CardHeader>
              <CardTitle className="text-2xl">Forgot password</CardTitle>
              <CardDescription>
                We'll send a verification code to this email if it matches an existing account.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!!location.state?.email}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={loading}>
                {loading && <EnvelopeOpenIcon className="mr-2 h-4 w-4 animate-spin" />}
                Send Code
              </Button>
              <Button variant="link" asChild>
                <Link to="/signin">Back to Sign In</Link>
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit}>
            <CardHeader className="items-center">
              <CardTitle className="text-2xl">Enter the 6-digit code</CardTitle>
              <div className="text-sm text-muted-foreground text-center pt-3">
                Check {maskEmail(email)} for a verification code.
              </div>
              <Button variant="link" onClick={() => setStep(1)} className="p-0 h-auto -mt-2">
                Change
              </Button>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Input
                id="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
              <Button variant="link" onClick={handleResendCode} disabled={loading} className="p-0 h-auto justify-self-start">
                Resend code
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={loading}>
                {loading && <EnvelopeOpenIcon className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
              <p className="text-xs text-muted-foreground text-center px-4">
                If you don't see the email in your inbox, check your spam folder. If it's not there, the email address may not be confirmed, or it may not match an existing account.
              </p>
            </CardFooter>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit}>
            <CardHeader>
              <CardTitle className="text-2xl">Choose a new password</CardTitle>
              <CardDescription>
                To secure your account, choose a strong password of at least 8 characters long.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeNoneIcon /> : <EyeOpenIcon />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Retype new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeNoneIcon /> : <EyeOpenIcon />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading && <LockClosedIcon className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPasswordNew;
