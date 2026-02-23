export interface TelegramAuthData {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
  auth_date: number;
  hash: string;
  phone_number?: string | null;
  tg_username?: string | null;
}

export interface LoginResponse {
  user_id: string;
  tg_id: number;
  tg_username: string | null;
  phone_number: string | null;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
