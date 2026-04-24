import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().trim().min(1, "Required").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});
type FormVals = z.infer<typeof schema>;

export default function TaskFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "" },
  });

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/tasks/${id}`)
      .then(({ data }) => form.reset({ title: data.title, description: data.description ?? "" }))
      .catch(() =>
        toast({ title: "Couldn't load task", variant: "destructive" })
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (vals: FormVals) => {
    try {
      if (isEdit) {
        await api.put(`/tasks/${id}`, vals);
        toast({ title: "Task updated" });
      } else {
        await api.post("/tasks", vals);
        toast({ title: "Task created" });
      }
      navigate("/dashboard/tasks");
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.response?.data?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{isEdit ? "Edit task" : "Create task"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={6} {...form.register("description")} />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-primary shadow-elevated">
                {isEdit ? "Save changes" : "Create task"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
