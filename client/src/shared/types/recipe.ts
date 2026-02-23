export interface RecipeListItem {
  id: string;
  slug: string;
  title: string;
  photo_url: string;
  prep_time: number;
  cook_time: number;
  difficulty: string;
  servings: string;
  is_favorited: boolean;
  is_in_history: boolean;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  title: string;
  description: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  amount: number;
  ingredient: {
    id: string;
    title: string;
    unit_of_measurement: string;
    slug: string;
  } | null;
}

export interface RecipeCategory {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeDetail {
  id: string;
  title: string;
  photo_url: string;
  description: string;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  prep_time: number;
  cook_time: number;
  difficulty: string;
  servings: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  steps: RecipeStep[];
  recipe_ingredients: RecipeIngredient[];
  categories: RecipeCategory[];
  is_favorited: boolean;
  is_in_history: boolean;
}

export interface FavoriteToggleResponse {
  id: string;
  is_favorited: boolean;
}

export interface HistoryToggleResponse {
  id: string;
  is_in_history: boolean;
}
