export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004';

export const ACTION_CONFIG = {
  DO_NOTHING: { label: 'Do Nothing', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: 'ShieldAlert' },
  COUPON_5: { label: '5% Coupon', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: 'Tag' },
  COUPON_10: { label: '10% Coupon', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: 'Percent' },
  RETRY_PAYMENT: { label: 'Retry Payment', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: 'RefreshCw' },
  COD_OPTION: { label: 'COD Option', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: 'Truck' },
  WHATSAPP_REMINDER: { label: 'WhatsApp Nudge', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: 'MessageCircle' },
  EMAIL_REMINDER: { label: 'Email Nudge', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: 'Mail' },
  FREE_SHIPPING: { label: 'Free Shipping', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: 'Package' },
  LIVE_CHAT: { label: 'Live Chat Support', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: 'Headphones' },
  CALL_SUPPORT: { label: 'Call Support', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: 'PhoneCall' },
  NOTIFY_LATER: { label: 'Notify Later', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', icon: 'Clock' },
};

export const RISK_LEVEL_CONFIG = {
  LOW: { label: 'Low Risk', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', color: '#10B981' },
  MEDIUM: { label: 'Medium Risk', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', color: '#F59E0B' },
  HIGH: { label: 'High Risk', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30', color: '#F97316' },
  CRITICAL: { label: 'Critical Risk', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30', color: '#F43F5E' },
};

export const INTENT_CONFIG = {
  WINDOW_SHOPPING: { label: 'Window Shopping', badge: 'bg-gray-500/20 text-gray-300' },
  PRICE_COMPARISON: { label: 'Price Comparison', badge: 'bg-purple-500/20 text-purple-300' },
  GENUINE_PURCHASE: { label: 'Genuine Purchase', badge: 'bg-emerald-500/20 text-emerald-300' },
  ACCIDENTAL_EXIT: { label: 'Accidental Exit', badge: 'bg-amber-500/20 text-amber-300' },
  PAYMENT_ISSUE: { label: 'Payment Failure', badge: 'bg-rose-500/20 text-rose-300' },
};
