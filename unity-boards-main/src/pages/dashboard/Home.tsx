import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListTodo, Plus, Users, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export default function DashboardHome() {
  const { user } = useAuth();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    api
      .get("/tasks")
      .then((r) => setCount(Array.isArray(r.data) ? r.data.length : r.data?.tasks?.length ?? 0))
      .catch(() => setCount(null));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Welcome back{user?.name ? `, ${user.name}` : ""}
          </h2>
          <p className="text-sm text-foreground/80">Here's what's happening in your workspace.</p>
        </div>
        <Button asChild className="bg-gradient-primary shadow-elevated">
          <Link to="/dashboard/tasks/new">
            <Plus className="mr-2 h-4 w-4" /> New task
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-card transition-smooth hover:shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{count ?? "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {user?.role === "member" ? "Tasks you created" : "Across your organization"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card transition-smooth hover:shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Your role</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold capitalize text-foreground">{user?.role}</p>
            <p className="mt-1 text-xs text-muted-foreground">Permissions enforced server-side</p>
          </CardContent>
        </Card>

        <Card className="shadow-card transition-smooth hover:shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Organization</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="truncate text-lg font-semibold text-foreground">
              {user?.organizationId ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Strict tenant isolation</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
