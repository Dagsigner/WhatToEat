export interface IngredientRow {
  ingredient_id: string;
  title: string;
  unit: string;
  amount: number;
}

export interface LocalStep {
  localId: string;
  step_number: number;
  title: string;
  description?: string;
  photo_url?: string;
}
