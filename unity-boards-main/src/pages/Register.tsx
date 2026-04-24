import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(2, "Min 2 chars").max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(6, "Min 6 chars").max(100),
  organizationName: z.string().trim().min(2, "Min 2 chars").max(80),
});
type FormVals = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: doRegister, loading } = useAuth();
  const navigate = useNavigate();
  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", organizationName: "" },
  });

  const onSubmit = async (vals: FormVals) => {
    try {
      await doRegister(vals);
      toast({ title: "Welcome!", description: "Your workspace is ready." });
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      toast({
        title: "Registration failed",
        description:
          e?.friendlyMessage ??
          e?.response?.data?.message ??
          "Could not create your account.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-elevated">
            <CheckSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Create your workspace</CardTitle>
          <CardDescription>You'll be the Owner of your new organization</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization name</Label>
              <Input id="organizationName" {...form.register("organizationName")} />
              {form.formState.errors.organizationName && (
                <p className="text-xs text-destructive">{form.formState.errors.organizationName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" autoComplete="new-password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-elevated">
              {loading ? "Creating..." : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
