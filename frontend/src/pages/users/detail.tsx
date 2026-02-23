import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { getUser } from "@/api/users";

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <p>User not found</p>;

  const fields = [
    { label: "User ID", value: user.id },
    { label: "Telegram ID", value: user.tg_id },
    { label: "TG Username", value: user.tg_username ? `@${user.tg_username}` : "—" },
    { label: "App Username", value: user.username ?? "—" },
    { label: "First Name", value: user.first_name ?? "—" },
    { label: "Last Name", value: user.last_name ?? "—" },
    { label: "Phone", value: user.phone_number ?? "—" },
    { label: "Created", value: new Date(user.created_at).toLocaleString() },
    { label: "Updated", value: new Date(user.updated_at).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Details"
        action={
          <Button variant="outline" onClick={() => navigate("/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{user.first_name ?? user.username ?? `TG#${user.tg_id}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            {fields.map((f) => (
              <div key={f.label} className="flex justify-between text-sm">
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className="font-medium">{String(f.value)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
