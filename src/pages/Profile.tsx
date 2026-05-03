import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { logout } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const profileFormSchema = z.object({
  first_name: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  last_name: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  phone: z
    .string()
    .regex(/^\d{10}$/, {
      message: "Phone number must be exactly 10 digits.",
    }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<ProfileFormValues | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
    },
    mode: "onChange",
  });

  const fetchUserData = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
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
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      setUserData(data);
      form.reset(data);
    } catch (error) {
      toast("Failed to fetch user data ❌");
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  async function onSubmit(data: ProfileFormValues) {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch("/api/user/profile/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        logout();
        navigate("/signin");
        toast("Your session has expired. Please log in again. 🔑");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }

      toast("Profile updated successfully ✅");
      await fetchUserData();
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (error) {
      toast(`Failed to update profile: ${error}`);
    }
  }

  const handleLogout = () => {
    toast("Are you sure you want to log out?", {
      action: {
        label: "Logout",
        onClick: () => {
          logout();
          toast("You have been logged out.");
          navigate("/signin");
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const handleChangePassword = () => {
    navigate('/forget-password-new', { state: { email: userData?.email } });
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile Settings</CardTitle>
          <div>
            <Button variant="destructive" onClick={handleLogout} className="mr-2">
              Logout
            </Button>
            <Button onClick={handleChangePassword}>
              Change Password
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Your email" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your phone number"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={10}
                        {...field}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                          field.onChange(digitsOnly);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Update Profile</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
