import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./login";
import { authService } from "@/services/auth.service";
import { useApp } from "@/contexts/AppContext";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  city: z.string().min(2, "Enter your city"),
  password: z.string().min(6, "At least 6 characters"),
});

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — LocalPulse" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setApiError(null);
    try {
      // Register user
      await authService.register(values);
      
      // Auto-login to obtain the token
      const loginRes = await authService.login({
        email: values.email,
        password: values.password,
      });
      const { access_token } = loginRes.data.data;
      
      // Store token
      window.localStorage.setItem("lp_token", access_token);
      
      // Fetch user profile details
      const meRes = await authService.me();
      const user = meRes.data.data;
      
      setUser(user);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      window.localStorage.removeItem("lp_token");
      setUser(null);
      setApiError(err?.response?.data?.message ?? "Registration failed. Please try again.");
    }
  };

  return (
    <AuthShell title="Join LocalPulse" subtitle="Sign up and start making your neighborhood better">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Ananya Sharma" className="mt-1.5 h-11" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" className="mt-1.5 h-11" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" placeholder="Indore" className="mt-1.5 h-11" {...register("city")} />
          {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" className="mt-1.5 h-11" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>
        {apiError && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{apiError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full h-11 text-base font-semibold">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          Already a member? <Link to="/login" className="text-primary font-semibold">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
