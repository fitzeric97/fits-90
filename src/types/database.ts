export interface ClosetItem {
  id: string;
  user_id: string;
  product_name: string | null;
  brand_name: string;
  product_description: string | null;
  product_url: string | null;
  product_image_url: string | null;
  uploaded_image_url: string | null;
  price: string | null;
  size: string | null;
  color: string | null;
  category: string | null;
  purchase_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Fit {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  is_instagram_url: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLike {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  uploaded_image_url: string | null;
  price: string | null;
  brand_name: string | null;
  category: string | null;
  item_type: string | null;
  source_email: string | null;
  created_at: string;
}

export interface PromotionalEmail {
  id: string;
  user_id: string;
  brand_name: string;
  subject: string;
  snippet: string;
  sender_name: string;
  received_date: string;
  expires_at: string | null;
  is_expired: boolean;
  email_category: 'promotion' | 'order_confirmation' | 'shipping' | 'other';
  email_source: 'promotional' | 'inbox' | 'sent' | 'other';
  order_number: string | null;
  order_total: string | null;
  order_items: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface FitTag {
  id: string;
  fit_id: string;
  closet_item_id: string;
  item_order: number | null;
  created_at: string;
}

export interface InstagramConnection {
  id: string;
  user_id: string;
  instagram_username: string;
  instagram_user_id: string;
  access_token: string | null;
  connected_at: string;
  updated_at: string;
}

export interface UserConnection {
  id: string;
  user_id: string;
  connected_user_id: string;
  requested_by: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}