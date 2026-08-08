import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { 
  ShoppingCart, 
  CreditCard, 
  Clock, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  RefreshCw,
  ShieldCheck,
  Send
} from 'lucide-react';
import { ACTION_CONFIG, RISK_LEVEL_CONFIG, INTENT_CONFIG } from '../../utils/constants';

const SAMPLE_PRODUCTS = [
  { id: 'p1', name: 'Wireless Noise-Canceling Headphones', price: 4499, image: '🎧' },
  { id: 'p2', name: 'Smart Fitness Watch Series 5', price: 2999, image: '⌚' },
  { id: 'p3', name: 'Ergonomic Mechanical Keyboard', price: 3799, image: '⌨️' },
  { id: 'p4', name: 'Ultra HD Webcam 4K', price: 1999, image: '📷' },
];

export default function CustomerSimulator() {
  const { evaluateSession } = useSession();
  const [cart, setCart] = useState([
    { ...SAMPLE_PRODUCTS[0], qty: 1 }
  ]);
  const [sessionTime, setSessionTime] = useState(180);
  const [inactivity, setInactivity] = useState(45);
  const [paymentAttempts, setPaymentAttempts] = useState(1);
  const [paymentFailures, setPaymentFailures] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentError, setPaymentError] = useState('UPITimeout');
  const [checkoutProgress, setCheckoutProgress] = useState(4); // 4 = Payment step

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const cartValue = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const runSimulation = async () => {
    setLoading(true);
    const sessionFeatures = {
      session_id: `sim_${Date.now().toString().slice(-6)}`,
      user_id: 'user_sim_892',
      total_clicks: Math.floor(sessionTime / 10),
      pages_viewed: 5,
      time_on_site_seconds: sessionTime,
      unique_pages: 4,
      avg_time_per_page: Math.round(sessionTime / 5),
      scroll_depth_avg: 0.75,
      has_searched: 1,
      cart_value: cartValue,
      cart_items_count: itemsCount,
      items_added: itemsCount + 1,
      items_removed: 1,
      cart_value_changes: 2,
      checkout_progress: checkoutProgress,
      payment_attempts: paymentAttempts,
      payment_failures: paymentFailures,
      time_since_last_action: inactivity,
      device_type_mobile: 1,
      returning_user: 1,
      session_hour: 19,
      day_of_week: 4,
      user_lifetime_value: 8500,
      profit_margin_pct: 22.0,
      discount_budget_remaining: 500,
      campaign_budget_remaining: 45000,
      last_payment_method: paymentMethod,
      last_payment_error: paymentFailures > 0 ? paymentError : null,
      consent_email: true,
      consent_sms: false,
      consent_whatsapp: true,
      consent_push: true,
    };

    try {
      const sessionObj = await evaluateSession(sessionFeatures);
      setPrediction(sessionObj.prediction_raw);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 border-purple-500/20 bg-gradient-to-r from-purple-950/30 via-slate-900 to-blue-950/30 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white">Customer Session Simulator</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
              Interactive Testbench
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Simulate real customer behavior, payment failures, and cart changes to test the 6-Agent AI decision pipeline.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{loading ? 'Evaluating AI Pipeline...' : 'Run Risk & Recovery Scoring'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Session Simulator Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* E-Commerce Product Catalog & Cart */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-purple-400" />
              1. Simulated E-Commerce Store & Cart
            </h3>

            {/* Product grid */}
            <div className="grid grid-cols-2 gap-3">
              {SAMPLE_PRODUCTS.map((prod) => (
                <div key={prod.id} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{prod.image}</span>
                    <div>
                      <p className="text-xs font-medium text-gray-200 truncate w-32">{prod.name}</p>
                      <p className="text-xs text-purple-400 font-mono">₹{prod.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(prod)}
                    className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Current Cart Summary */}
            <div className="pt-3 border-t border-gray-800">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Current Cart Items ({itemsCount}):</span>
                <span className="text-white font-bold font-mono">Total: ₹{cartValue.toLocaleString()}</span>
              </div>
              <div className="space-y-1.5">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs bg-gray-800/40 p-2 rounded-lg">
                    <span className="text-gray-300">{item.name} × {item.qty}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-purple-300">₹{(item.price * item.qty).toLocaleString()}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-500 hover:text-rose-400"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment & Failure Simulation */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-400" />
              2. Payment Failure & Gateway Signals
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="NetBanking">Net Banking</option>
                  <option value="COD">Cash On Delivery</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Failure Signal / Error</label>
                <select
                  value={paymentError}
                  onChange={(e) => setPaymentError(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="UPITimeout">UPI App Timeout</option>
                  <option value="Declined">Bank Card Declined</option>
                  <option value="InsufficientFunds">Insufficient Funds</option>
                  <option value="GatewayError">Gateway Internal Error</option>
                  <option value="BankServerDown">Bank Server Down</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Payment Attempts: {paymentAttempts}</label>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={paymentAttempts}
                  onChange={(e) => setPaymentAttempts(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Payment Failures: {paymentFailures}</label>
                <input
                  type="range"
                  min="0"
                  max={paymentAttempts}
                  value={paymentFailures}
                  onChange={(e) => setPaymentFailures(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Session Timing & Inactivity */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              3. Inactivity & Checkout Funnel
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Inactivity Period: <span className="text-white font-mono">{inactivity}s</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="600"
                  step="15"
                  value={inactivity}
                  onChange={(e) => setInactivity(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Checkout Step Reached</label>
                <select
                  value={checkoutProgress}
                  onChange={(e) => setCheckoutProgress(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                >
                  <option value={1}>Step 1: Viewing Cart</option>
                  <option value={2}>Step 2: Shipping Address</option>
                  <option value={3}>Step 3: Shipping Method</option>
                  <option value={4}>Step 4: Payment Gateway</option>
                  <option value={5}>Step 5: Order Confirmation</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time AI Result Panel (5 cols) */}
        <div className="lg:col-span-5">
          {prediction ? (
            <div className="glass-card p-6 space-y-5 sticky top-20 border-purple-500/40 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  AI Decision Intelligence Output
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ⚡ {prediction.pipeline_latency_ms} ms
                </span>
              </div>

              {/* Risk Level Badge & Score */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/80 border border-gray-800">
                <div>
                  <span className="text-xs text-gray-400 block">Abandonment Risk</span>
                  <span className="text-2xl font-black font-mono text-white">
                    {(prediction.risk_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-3 py-1 rounded-full border font-bold ${RISK_LEVEL_CONFIG[prediction.risk_level]?.badge}`}>
                    {prediction.risk_level} RISK
                  </span>
                  <span className="text-[11px] text-gray-400 block mt-1">
                    Intent: <strong className="text-gray-200">{prediction.intent_category}</strong>
                  </span>
                </div>
              </div>

              {/* Recommended Action Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/40 space-y-2">
                <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider block">
                  Best Recovery Action (Bounded Menu)
                </span>
                <div className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>{ACTION_CONFIG[prediction.recommended_action]?.label || prediction.recommended_action}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-white/5">
                  {prediction.action_reason}
                </p>
              </div>

              {/* Top Risk Factors (SHAP) */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-300 block">Top SHAP Risk Factors</span>
                <div className="space-y-1.5">
                  {prediction.top_risk_factors.map((rf, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-gray-900/60 p-2 rounded-lg border border-gray-800">
                      <span className="text-gray-300 truncate max-w-[200px]">{rf.description}</span>
                      <span className={rf.direction === 'increases_risk' ? 'text-rose-400 font-mono text-[11px]' : 'text-emerald-400 font-mono text-[11px]'}>
                        {rf.direction === 'increases_risk' ? '+' : '-'}{rf.shap_value.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Margin & Consent Guardrail checks */}
              <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800 text-xs space-y-1 text-gray-400">
                <div className="flex justify-between">
                  <span>Margin Protection:</span>
                  <span className={prediction.margin_check.coupon_allowed ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                    {prediction.margin_check.coupon_allowed ? `Allowed (Max ${prediction.margin_check.max_discount_pct}%)` : 'Discount Blocked'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Trail Logged:</span>
                  <span className="text-purple-400 font-mono text-[10px]">Model v{prediction.model_version}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 h-full flex flex-col justify-center items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-white">Ready for Simulation</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Adjust cart items, payment signals, and timing parameters on the left, then click <strong>"Run Risk & Recovery Scoring"</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
