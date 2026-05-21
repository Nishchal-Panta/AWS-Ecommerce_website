"use client";
import { useCartStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const router = useRouter();

  async function handleCheckout() {
    if (!items.length) return;
    setLoading(true); setError("");
    try {
      const res = await api.post<{ orderId: string }>("/orders", { items });
      clearCart();
      router.push(`/orders?new=${res.orderId}`);
    } catch (e: any) {
      setError(e.message ?? "Checkout failed. Please sign in first.");
    } finally { setLoading(false); }
  }

  if (!items.length) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🛒</div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your cart is empty</h2>
      <Link href="/products/" className="text-indigo-600 hover:underline">Browse products →</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
      <div className="space-y-4 mb-8">
        {items.map(item => (
          <div key={item.productId} className="bg-white rounded-xl border p-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" /> : <span className="text-2xl">📦</span>}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.name}</h3>
              <p className="text-indigo-600 font-semibold">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100">−</button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100">+</button>
            </div>
            <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border p-6">
        <div className="flex justify-between text-lg font-bold text-gray-900 mb-4">
          <span>Total</span><span>${total().toFixed(2)}</span>
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button onClick={handleCheckout} disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
          {loading ? "Placing order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
