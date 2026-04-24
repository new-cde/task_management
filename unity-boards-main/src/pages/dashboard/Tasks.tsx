import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  organization_id: string;
}

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/tasks");
      setTasks(Array.isArray(data) ? data : data.tasks ?? []);
    } catch (e: any) {
      toast({
        title: "Couldn't load tasks",
        description: e?.response?.data?.message ?? "Check that the backend is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const canEdit = (t: Task) =>
    user?.role === "owner" || user?.role === "admin" || t.created_by === user?.userId;

  const onDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.delete(`/tasks/${pendingDelete.id}`);
      setTasks((prev) => prev.filter((x) => x.id !== pendingDelete.id));
      toast({ title: "Task deleted" });
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.response?.data?.message ?? "You may not have permission.",
        variant: "destructive",
      });
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Tasks</h2>
          <p className="text-sm text-foreground/80">
            {user?.role === "member"
              ? "Tasks you've created"
              : "All tasks in your organization"}
          </p>
        </div>
        <Button asChild className="bg-gradient-primary shadow-elevated">
          <Link to="/dashboard/tasks/new">
            <Plus className="mr-2 h-4 w-4" /> New task
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center shadow-card">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <ListTodo className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No tasks yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Create your first task to get started.</p>
          <Button asChild className="bg-gradient-primary shadow-elevated">
            <Link to="/dashboard/tasks/new">
              <Plus className="mr-2 h-4 w-4" /> New task
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t) => (
            <Card
              key={t.id}
              className="group flex flex-col shadow-card transition-smooth hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <CardHeader>
                <CardTitle className="line-clamp-2 text-base">{t.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {t.description || "No description"}
                </p>
                {canEdit(t) && (
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link to={`/dashboard/tasks/${t.id}/edit`}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPendingDelete(t)}
                      className="flex-1 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>This action can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
