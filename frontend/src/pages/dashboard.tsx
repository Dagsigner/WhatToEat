import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, FolderTree, Carrot, Users, ImageIcon } from "lucide-react";
import { listRecipes } from "@/api/recipes";
import { listCategories } from "@/api/categories";
import { listIngredients } from "@/api/ingredients";
import { listUsers } from "@/api/users";
import { listImages } from "@/api/images";
import { PageHeader } from "@/components/shared/page-header";

const StatCard = memo(function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{loading ? "..." : value}</div>
      </CardContent>
    </Card>
  );
});

export default function DashboardPage() {
  const recipes = useQuery({ queryKey: ["recipes", "count"], queryFn: () => listRecipes(1, 0), staleTime: 60_000 });
  const categories = useQuery({ queryKey: ["categories", "count"], queryFn: () => listCategories(1, 0), staleTime: 60_000 });
  const ingredients = useQuery({ queryKey: ["ingredients", "count"], queryFn: () => listIngredients(1, 0), staleTime: 60_000 });
  const users = useQuery({ queryKey: ["users", "count"], queryFn: () => listUsers(1, 0), staleTime: 60_000 });
  const images = useQuery({ queryKey: ["images", "count"], queryFn: () => listImages(1, 0), staleTime: 60_000 });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your application data" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Recipes" value={recipes.data?.total ?? 0} icon={UtensilsCrossed} loading={recipes.isLoading} />
        <StatCard title="Categories" value={categories.data?.total ?? 0} icon={FolderTree} loading={categories.isLoading} />
        <StatCard title="Ingredients" value={ingredients.data?.total ?? 0} icon={Carrot} loading={ingredients.isLoading} />
        <StatCard title="Users" value={users.data?.total ?? 0} icon={Users} loading={users.isLoading} />
        <StatCard title="Images" value={images.data?.total ?? 0} icon={ImageIcon} loading={images.isLoading} />
      </div>
    </div>
  );
}
