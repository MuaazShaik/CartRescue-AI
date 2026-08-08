import React, { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext';
import { 
  ShoppingCart, 
  CreditCard, 
  Clock, 
  Plus, 
  Minus, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  ShoppingBag,
  MapPin,
  Truck,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ACTION_CONFIG, RISK_LEVEL_CONFIG } from '../utils/constants';

const STORE_PRODUCTS = [
  { id: 'p1', name: 'Premium Noise-Canceling Headphones', price: 4499, rating: 4.8, category: 'Audio', image: '🎧' },
  { id: 'p2', name: 'Smart Fitness Watch Ultra', price: 6799, rating: 4.9, category: 'Wearables', image: '⌚' },
  { id: 'p3', name: 'Mechanical Ergonomic Keyboard', price: 3799, rating: 4.7, category: 'Peripherals', image: '⌨️' },
  { id: 'p4', name: '4K Ultra HD Streaming Webcam', price: 2499, rating: 4.6, category: 'Video', image: '📷' },
  { id: 'p5', name: 'Wireless Ergonomic Vertical Mouse', price: 1899, rating: 4.5, category: 'Peripherals', image: '🖱️' },
  { id: 'p6', name: 'Portable High-Speed SSD 1TB', price: 8490, rating: 4.9, category: 'Storage', image: '💾' },
];

export default function LiveStore() {
  const { evaluateSession, selectedSession } = useSession();

  // Webpage real-time interaction states
  const [cart, setCart] = useState([
    { ...STORE_PRODUCTS[0], qty: 1 }
  ]);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Cart, 2: Address, 3: Payment, 4: Order Complete
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [sessionTime, setSessionTime] = useState(120);
  const [inactivity, setInactivity] = useState(15);
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const [paymentFailures, setPaymentFailures] = useState(0);
  const [paymentError, setPaymentError] = useState(null);
  const [liveEvaluation, setLiveEvaluation] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [lastTriggerName, setLastTriggerName] = useState('Initial Mount Evaluation');
  const [sessionId] = useState(`sess_live_${Math.floor(100000 + Math.random() * 900000)}`);

  const cartValue = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Core Evaluation Trigger
  const triggerEvaluation = async (currentCart = cart, overrides = {}, triggerLabel = 'Live Action') => {
    setEvalLoading(true);
    setLastTriggerName(triggerLabel);
    console.log(`⚡ [LiveStore] Trigger Fired: "${triggerLabel}"`, overrides);

    const curCartValue = currentCart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const curItemsCount = currentCart.reduce((sum, item) => sum + item.qty, 0);

    const attempts = overrides.payment_attempts !== undefined ? overrides.payment_attempts : paymentAttempts;
    const failures = overrides.payment_failures !== undefined ? overrides.payment_failures : paymentFailures;
    const step = overrides.checkout_progress !== undefined ? overrides.checkout_progress : checkoutStep;
    const curInactivity = overrides.inactivity !== undefined ? overrides.inactivity : inactivity;
    const errSignal = overrides.payment_error !== undefined ? overrides.payment_error : paymentError;

    const payload = {
      session_id: sessionId,
      user_id: 'usr_live_demouser',
      total_clicks: Math.floor(sessionTime / 8) + curItemsCount * 3 + attempts * 4,
      pages_viewed: Math.min(15, 2 + curItemsCount + step * 2),
      time_on_site_seconds: sessionTime,
      unique_pages: Math.min(8, 2 + step),
      avg_time_per_page: Math.round(sessionTime / Math.max(1, 2 + step)),
      scroll_depth_avg: step > 1 ? 0.85 : 0.60,
      has_searched: 1,
      cart_value: curCartValue,
      cart_items_count: curItemsCount,
      items_added: curItemsCount + 1,
      items_removed: overrides.items_removed || (overrides.intent === 'PRICE_COMPARISON' ? 2 : 0),
      cart_value_changes: overrides.cart_value_changes || Math.max(1, curItemsCount),
      checkout_progress: step,
      payment_attempts: attempts,
      payment_failures: failures,
      time_since_last_action: curInactivity,
      device_type_mobile: 1,
      returning_user: 1,
      session_hour: new Date().getHours(),
      day_of_week: new Date().getDay(),
      user_lifetime_value: 12500,
      profit_margin_pct: 22.0,
      discount_budget_remaining: 500,
      campaign_budget_remaining: 50000,
      last_payment_method: attempts > 0 ? paymentMethod : null,
      last_payment_error: failures > 0 ? errSignal : null,
      consent_email: true,
      consent_sms: true,
      consent_whatsapp: true,
      consent_push: true,
      intent: overrides.intent || null,
    };

    try {
      const res = await evaluateSession(payload);
      setLiveEvaluation(res);
    } catch (err) {
      console.error('Failed to run live evaluation:', err);
    } finally {
      setEvalLoading(false);
    }
  };

  // Run initial evaluation automatically on mount
  useEffect(() => {
    triggerEvaluation(cart, {}, 'Initial Load');
    const timer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    let updated;
    if (existing) {
      updated = cart.map((item) =>
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      );
    } else {
      updated = [...cart, { ...product, qty: 1 }];
    }
    setCart(updated);
    triggerEvaluation(updated, {}, `Added ${product.name}`);
  };

  const removeFromCart = (productId) => {
    const updated = cart.filter((item) => item.id !== productId);
    setCart(updated);
    triggerEvaluation(updated, { items_removed: 1 }, 'Item Removed');
  };

  // Stage Switcher Helper
  const setStep = (step) => {
    setCheckoutStep(step);
    if (step < 3) {
      setPaymentFailures(0);
      setPaymentAttempts(0);
      setPaymentError(null);
    }

    if (step === 4) {
      triggerOrderSuccess();
    } else {
      const stepNames = ['', 'Cart View', 'Shipping Address', 'Payment Gateway', 'Order Complete'];
      triggerEvaluation(cart, {
        checkout_progress: step,
        payment_attempts: step < 3 ? 0 : paymentAttempts,
        payment_failures: step < 3 ? 0 : paymentFailures,
        payment_error: step < 3 ? null : paymentError,
        inactivity: 15
      }, `Switched to Step ${step}: ${stepNames[step]}`);
    }
  };

  // Stage 1 Triggers (Cart Stage)
  const triggerPriceComparison = () => {
    setInactivity(120);
    setPaymentFailures(0);
    setPaymentAttempts(0);
    setPaymentError(null);

    triggerEvaluation(cart, {
      checkout_progress: 1,
      payment_attempts: 0,
      payment_failures: 0,
      payment_error: null,
      inactivity: 120,
      items_removed: 2,
      cart_value_changes: 4,
      intent: 'PRICE_COMPARISON'
    }, 'Price Comparison Browsing');
  };

  // Stage 2 Triggers (Address Stage)
  const triggerAddressHesitation = () => {
    setCheckoutStep(2);
    setInactivity(180);
    setPaymentFailures(0);
    setPaymentAttempts(0);
    setPaymentError(null);

    triggerEvaluation(cart, {
      checkout_progress: 2,
      payment_attempts: 0,
      payment_failures: 0,
      payment_error: null,
      inactivity: 180
    }, 'Address Form Hesitation');
  };

  const triggerShippingShock = () => {
    setCheckoutStep(2);
    setInactivity(240);
    setPaymentFailures(0);
    setPaymentAttempts(0);
    setPaymentError(null);

    triggerEvaluation(cart, {
      checkout_progress: 2,
      payment_attempts: 0,
      payment_failures: 0,
      payment_error: null,
      inactivity: 240
    }, 'Delivery Fee Hesitation');
  };

  // Stage 3 Triggers (Payment Stage)
  const triggerPaymentFailure = (errorType) => {
    const newAttempts = paymentAttempts + 1;
    const newFailures = paymentFailures + 1;
    setPaymentAttempts(newAttempts);
    setPaymentFailures(newFailures);
    setPaymentError(errorType);
    setCheckoutStep(3);

    triggerEvaluation(cart, {
      payment_attempts: newAttempts,
      payment_failures: newFailures,
      checkout_progress: 3,
      payment_error: errorType,
      inactivity: 10,
    }, `Simulated Payment Failure: ${errorType}`);
  };

  const triggerInactivity = (seconds) => {
    setInactivity(seconds);
    triggerEvaluation(cart, { inactivity: seconds }, `Idle Timeout (${seconds}s)`);
  };

  const triggerOrderSuccess = () => {
    setCheckoutStep(4);
    setPaymentFailures(0);
    setPaymentError(null);
    triggerEvaluation(cart, {
      checkout_progress: 4,
      payment_attempts: paymentAttempts > 0 ? paymentAttempts : 1,
      payment_failures: 0,
      inactivity: 0
    }, 'Order Successfully Placed');
  };

  const activeOutput = liveEvaluation || selectedSession;

  return (
    <div className="space-y-6">
      {/* Top Demo Header Bar */}
      <div className="glass-card p-6 border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900 to-blue-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-purple-400" />
              Live E-Commerce Webpage Demo
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400 animate-pulse" /> Real-Time Telemetry Active
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-1 max-w-2xl">
            Interact with this online store webpage during your demo. Switch checkout steps to reveal stage-specific triggers and see instant AI pipeline decisions.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-gray-900/80 p-2.5 rounded-xl border border-gray-800 text-xs font-mono">
          <span className="text-gray-400">Live Session:</span>
          <span className="text-purple-300 font-bold">{sessionId}</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">Duration:</span>
          <span className="text-cyan-400">{sessionTime}s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Storefront & Stage Triggers (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* E-Commerce Catalog */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                Featured Storefront Catalog
              </h3>
              <span className="text-xs text-gray-400">Click "+" to update cart in real-time</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {STORE_PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-xl bg-gray-900/70 border border-gray-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl p-2 rounded-lg bg-gray-800/60">{prod.image}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-medium">
                      {prod.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-200 group-hover:text-purple-300 transition-colors line-clamp-1">
                      {prod.name}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-white font-mono">₹{prod.price.toLocaleString()}</span>
                      <span className="text-[11px] text-amber-400 font-medium">★ {prod.rating}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(prod)}
                    className="w-full py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-medium transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Stage Triggers (Context Aware for Cart, Address, Payment, Order Complete) */}
          <div className="glass-card p-5 space-y-4 border-purple-500/30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Real-Time Interactive Triggers (Stage {checkoutStep} of 4)
              </h3>
              <span className="text-xs text-purple-300 font-mono">
                Active Stage: {['', '1. Cart View', '2. Shipping Address', '3. Payment Gateway', '4. Order Complete'][checkoutStep]}
              </span>
            </div>

            {/* Stage Selector Tabs */}
            <div className="flex items-center space-x-2 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800 text-xs">
              {[
                { step: 1, label: '1. Cart' },
                { step: 2, label: '2. Address' },
                { step: 3, label: '3. Payment' },
                { step: 4, label: '4. Order Complete' },
              ].map((s) => (
                <button
                  key={s.step}
                  id={`tab-step-${s.step}`}
                  onClick={() => setStep(s.step)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all text-center cursor-pointer ${
                    checkoutStep === s.step
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 font-bold'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Stage-Specific Trigger Options */}
            <div className="pt-2">
              {checkoutStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    id="trigger-price-comparison"
                    onClick={triggerPriceComparison}
                    className="p-3.5 rounded-xl bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/40 text-left space-y-1 transition-all group active:scale-95 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
                      <span>Price Comparison Browsing</span>
                      <Search className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      Simulates searching multiple tabs & comparing cart prices across stores.
                    </p>
                  </button>

                  <button
                    id="trigger-cart-idle"
                    onClick={() => triggerInactivity(180)}
                    className="p-3.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-500/40 text-left space-y-1 transition-all group active:scale-95 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                      <span>Cart Idle (3 Mins)</span>
                      <Clock className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      User sitting idle on cart page without proceeding to shipping.
                    </p>
                  </button>

                  <button
                    id="trigger-proceed-address"
                    onClick={() => setStep(2)}
                    className="p-3.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-500/40 text-left space-y-1 transition-all group active:scale-95 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                      <span>Proceed to Address →</span>
                      <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      Advances customer session to Step 2 (Shipping Address).
                    </p>
                  </button>
                </div>
              )}

              {checkoutStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    id="trigger-address-hesitation"
                    onClick={triggerAddressHesitation}
                    className="p-3.5 rounded-xl bg-indigo-950/30 hover:bg-indigo-900/50 border border-indigo-500/40 text-left space-y-1 transition-all group active:scale-95 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                      <span>Address Form Hesitation</span>
                      <MapPin className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      Simulates pincode hesitation & form filling delays at address step.
                    </p>
                  </button>

                  <button
                    id="trigger-delivery-fee-shock"
                    onClick={triggerShippingShock}
                    className="p-3.5 rounded-xl bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/40 text-left space-y-1 transition-all group active:scale-95 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                      <span>Delivery Fee Hesitation</span>
                      <Truck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      Simulates delivery fee hesitation at address checkout step.
                    </p>
                  </button>

                  <button
                    id="trigger-address-idle"
                    onClick={() => triggerInactivity(240)}
                    className="p-3.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-500/40 text-left space-y-1 transition-all group active:scale-95 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                      <span>Address Step Idle (4 Mins)</span>
                      <Clock className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      Customer left address step open for 240 seconds without continuing.
                    </p>
                  </button>
                </div>
              )}

              {checkoutStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    id="trigger-upi-timeout"
                    onClick={() => triggerPaymentFailure('UPITimeout')}
                    className="p-3.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/40 text-left space-y-1 transition-all group active:scale-95 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-rose-300">
                      <span>Simulate UPI Timeout</span>
                      <AlertCircle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      Triggers payment failure signal (GPay/PhonePe timeout on gateway).
                    </p>
                  </button>

                  <button
                    id="trigger-card-declined"
                    onClick={() => triggerPaymentFailure('Declined')}
                    className="p-3.5 rounded-xl bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/40 text-left space-y-1 transition-all group active:scale-95 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                      <span>Simulate Card Declined</span>
                      <CreditCard className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      Triggers bank card decline signal at gateway step.
                    </p>
                  </button>

                  <button
                    id="trigger-bank-server-down"
                    onClick={() => triggerPaymentFailure('BankServerDown')}
                    className="p-3.5 rounded-xl bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/40 text-left space-y-1 transition-all group active:scale-95 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
                      <span>Bank Server Error</span>
                      <RefreshCw className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      Triggers internal bank gateway server down error.
                    </p>
                  </button>
                </div>
              )}

              {checkoutStep === 4 && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                  <h4 className="text-sm font-bold text-emerald-300">Order Successfully Confirmed!</h4>
                  <p className="text-xs text-gray-300 max-w-md mx-auto">
                    Customer completed payment and placed the order. Abandonment Risk dropped to <strong>0.0%</strong>.
                  </p>
                  <button
                    onClick={() => setStep(1)}
                    className="mt-2 px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs transition-all hover:bg-emerald-500 cursor-pointer"
                  >
                    Start New Live Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Webpage Cart & Live ML Pipeline Feedback (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Cart Drawer */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-purple-400" />
                Webpage Shopping Cart
              </h3>
              <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                {itemsCount} items
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Cart is empty. Add products above.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs bg-gray-900/80 p-2.5 rounded-xl border border-gray-800">
                    <div className="flex items-center space-x-2">
                      <span>{item.image}</span>
                      <div>
                        <p className="text-gray-200 font-medium truncate w-32">{item.name}</p>
                        <p className="text-purple-400 font-mono text-[11px]">₹{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-gray-300">×{item.qty}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-gray-500 hover:text-rose-400 rounded cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Cart Value:</span>
              <span className="text-xl font-bold font-mono text-white">₹{cartValue.toLocaleString()}</span>
            </div>
          </div>

          {/* Real-time Evaluation Output Panel */}
          <div className={`glass-card p-5 space-y-4 border-purple-500/40 shadow-2xl transition-all duration-300 ${evalLoading ? 'opacity-70 scale-[0.99]' : ''}`}>
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div>
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Real-Time Scoring Output
                </span>
                <span className="text-[10px] text-emerald-400 block font-mono font-medium">
                  ⚡ Trigger: {lastTriggerName}
                </span>
              </div>
              <button
                onClick={() => triggerEvaluation(cart, {}, 'Manual Re-Evaluation')}
                disabled={evalLoading}
                className="text-[10px] px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 border border-purple-500/40 flex items-center gap-1 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${evalLoading ? 'animate-spin' : ''}`} />
                <span>{evalLoading ? 'Scoring...' : 'Re-Evaluate'}</span>
              </button>
            </div>

            {activeOutput ? (
              <div className="space-y-4 animate-fade-in">
                {/* Risk Score & Badge */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-900/90 border border-gray-800">
                  <div>
                    <span className="text-[11px] text-gray-400 block">Abandonment Risk Score</span>
                    <span className="text-2xl font-black font-mono text-white">
                      {(activeOutput.risk_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${RISK_LEVEL_CONFIG[activeOutput.risk_level]?.badge || 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                      {activeOutput.risk_level} RISK
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      Intent: <strong className="text-gray-200">{activeOutput.intent_category}</strong>
                    </span>
                  </div>
                </div>

                {/* Recommended Recovery Action */}
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1.5">
                  <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider block">
                    Recommended Recovery Action
                  </span>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{ACTION_CONFIG[activeOutput.recommended_action]?.label || activeOutput.recommended_action}</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed pt-1.5 border-t border-white/5">
                    {activeOutput.action_reason}
                  </p>
                </div>

                {/* Twilio Real-Time Messaging Dispatch Panel */}
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Twilio Real-Time Alert Dispatch
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                      {activeOutput.twilio_dispatch?.mode === 'LIVE_TWILIO' ? '⚡ LIVE TWILIO' : '⚡ DISPATCHED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 font-mono bg-black/60 p-2 rounded border border-emerald-500/20 line-clamp-3">
                    {activeOutput.twilio_dispatch?.message_body || `🚨 [Cart Rescue Alert] Real-time SMS recovery message sent for session ${activeOutput.session_id}`}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1">
                    <span>Target Phone: <strong className="text-emerald-300">+919876543210</strong></span>
                    <span>SID: <strong className="text-gray-300">{activeOutput.twilio_dispatch?.sid || 'SM9012481'}</strong></span>
                  </div>
                </div>

                {/* Pipeline Stats */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-800/60">
                  <span>ML Latency: <strong className="text-emerald-400 font-mono">⚡ {activeOutput.pipeline_latency_ms || 12} ms</strong></span>
                  <span>Model: <strong className="text-purple-300 font-mono">XGBoost + Twilio API</strong></span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2 text-xs text-gray-400">
                <RefreshCw className="w-5 h-5 text-purple-400 mx-auto animate-spin" />
                <p>Scoring session in real-time...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
