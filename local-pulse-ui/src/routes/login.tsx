import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";
import { useApp } from "@/contexts/AppContext";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — LocalPulse" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setApiError(null);
    try {
      const res = await authService.login(values);
      const { access_token } = res.data.data;
      
      // Store the token immediately so the subsequent /auth/me request is authenticated
      window.localStorage.setItem("lp_token", access_token);
      
      // Fetch the actual user details using the token
      const meRes = await authService.me();
      const user = meRes.data.data;
      
      setUser(user);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      window.localStorage.removeItem("lp_token");
      setUser(null);
      setApiError(err?.response?.data?.message ?? "Invalid email or password. Please try again.");
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your LocalPulse account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" className="mt-1.5 h-11" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" className="mt-1.5 h-11" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>
        {apiError && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{apiError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full h-11 text-base font-semibold">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          New to LocalPulse? <Link to="/signup" className="text-primary font-semibold">Create account</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[color:var(--civic-orange-soft)] to-[color:var(--civic-blue-soft)]">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.jpg" alt="LocalPulse" className="h-9 w-9 rounded-xl object-cover" />
          <span className="font-bold text-lg">LocalPulse</span>
        </Link>
        <div>
          <h2 className="text-3xl font-extrabold leading-tight max-w-md">
            "Reported a streetlight outage at 9 PM. Fixed by next morning."
          </h2>
          <p className="mt-3 text-muted-foreground">— Priya, Indore</p>
        </div>
        <p className="text-xs text-muted-foreground">© LocalPulse — for India's cities</p>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/logo.jpg" alt="LocalPulse" className="h-9 w-9 rounded-xl object-cover" />
            <span className="font-bold text-lg">LocalPulse</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
