import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  const rows: { label: string; value: string }[] = [
    { label: "User ID", value: user.userId },
    { label: "Email", value: user.email ?? "—" },
    { label: "Name", value: user.name ?? "—" },
    { label: "Organization ID", value: user.organizationId },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">Profile</h2>
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Account</CardTitle>
          <Badge variant="secondary" className="capitalize">{user.role}</Badge>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between gap-4 py-3">
                <dt className="text-sm text-muted-foreground">{r.label}</dt>
                <dd className="truncate text-sm font-medium text-foreground">{r.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
