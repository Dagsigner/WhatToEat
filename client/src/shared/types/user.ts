export interface UserProfile {
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

export interface UserUpdateData {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  phone_number?: string | null;
}
