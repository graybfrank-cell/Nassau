export type SubscriptionStatus = 'free' | 'active' | 'trialing' | 'canceled';

export type SubscriptionTier = 'pro' | 'premium' | null;

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  avatar_url: string;
  created_at: Date;
  updated_at: Date;
  venmo_username: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_expires_at: Date | null;
}
