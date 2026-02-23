export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  username: string;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LogoutResponse {
  message: string;
}

export interface UserAdmin {
  id: string;
  tg_id: number;
  tg_username: string | null;
  username: string | null;
  phone_number: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserDeleteResponse {
  id: string;
  is_deleted: boolean;
}

export interface CategoryAdmin {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  title: string;
  slug: string;
  is_active: boolean;
}

export interface CategoryUpdate {
  title?: string;
  slug?: string;
  is_active?: boolean;
}

export interface CategoryDeleteResponse {
  id: string;
  is_deleted: boolean;
}

export interface IngredientAdmin {
  id: string;
  title: string;
  unit_of_measurement: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IngredientCreate {
  title: string;
  unit_of_measurement: string;
  slug: string;
  is_active: boolean;
}

export interface IngredientUpdate {
  title?: string;
  unit_of_measurement?: string;
  slug?: string;
  is_active?: boolean;
}

export interface IngredientDeleteResponse {
  id: string;
  is_deleted: boolean;
}

export interface RecipeAdmin {
  id: string;
  title: string;
  description: string;
  photo_url: string;
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
  steps: StepResponse[];
  recipe_ingredients: RecipeIngredientResponse[];
  categories: CategoryResponse[];
}

export interface CategoryResponse {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StepResponse {
  id: string;
  recipe_id: string;
  step_number: number;
  title: string;
  description: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredientResponse {
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

export interface RecipeCreate {
  title: string;
  photo_url: string;
  description: string;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
  prep_time: number;
  cook_time: number;
  difficulty: string;
  servings: string;
  slug: string;
  is_active: boolean;
  ingredient_ids?: { ingredient_id: string; amount: number }[];
  category_ids?: string[];
}

export interface RecipeUpdate {
  title?: string;
  photo_url?: string;
  description?: string;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
  prep_time?: number;
  cook_time?: number;
  difficulty?: string;
  servings?: string;
  slug?: string;
  is_active?: boolean;
  categories?: string[];
  ingredients?: { ingredient_id: string; amount: number }[];
}

export interface RecipeDeleteResponse {
  id: string;
  is_deleted: boolean;
}

export interface StepAdmin {
  id: string;
  recipe_id: string;
  step_number: number;
  title: string;
  description: string | null;
  photo_url: string | null;
  is_active: boolean;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface StepCreate {
  recipe_id: string;
  step_number: number;
  title: string;
  description?: string;
  photo_url?: string;
  slug?: string;
  is_active?: boolean;
}

export interface StepUpdate {
  step_number?: number;
  title?: string;
  description?: string;
  photo_url?: string;
  slug?: string;
  is_active?: boolean;
}

export interface StepDeleteResponse {
  id: string;
  is_deleted: boolean;
}

export interface ImageItem {
  id: string;
  url: string;
  filename: string | null;
  content_type: string | null;
  size: number | null;
  created_at: string;
  updated_at: string;
}

export interface ImageUploadResponse {
  id: string;
  url: string;
  filename: string | null;
  content_type: string | null;
  size: number | null;
  created_at: string;
}
