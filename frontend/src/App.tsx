import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

const LoginPage = lazy(() => import("@/pages/login"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const CategoriesListPage = lazy(() => import("@/pages/categories/list"));
const IngredientsListPage = lazy(() => import("@/pages/ingredients/list"));
const RecipesListPage = lazy(() => import("@/pages/recipes/list"));
const RecipeFormPage = lazy(() => import("@/pages/recipes/form"));
const UsersListPage = lazy(() => import("@/pages/users/list"));
const UserDetailPage = lazy(() => import("@/pages/users/detail"));
const ImagesListPage = lazy(() => import("@/pages/images/list"));
const StepsListPage = lazy(() => import("@/pages/steps/list"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/recipes" element={<RecipesListPage />} />
                <Route path="/recipes/new" element={<RecipeFormPage />} />
                <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
                <Route path="/categories" element={<CategoriesListPage />} />
                <Route path="/ingredients" element={<IngredientsListPage />} />
                <Route path="/users" element={<UsersListPage />} />
                <Route path="/users/:id" element={<UserDetailPage />} />
                <Route path="/steps" element={<StepsListPage />} />
                <Route path="/images" element={<ImagesListPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
