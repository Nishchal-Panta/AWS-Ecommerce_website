"use client";
import { useEffect, useState, Suspense } from "react";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";

type Order = { id: string; status: string; total: number; created_at: string; };

const statusColor: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped:   "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function OrdersList() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const params = useSearchParams();
  const newId  = params.get("new");

  useEffect(() => {
    api.get<{ orders: Order[] }>("/orders")
      .then(d => setOrders(d.orders))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading orders...</div>;
  if (error)   return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h1>
      {newId && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-800">
          ✅ Order placed! ID: <strong>{newId.slice(0,8).toUpperCase()}</strong>
          <br /><span className="text-sm">A confirmation email will arrive shortly.</span>
        </div>
      )}
      {!orders.length ? (
        <div className="text-center py-20 text-gray-400">No orders yet.</div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-xl border p-5 flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-gray-500">#{o.id.slice(0,8).toUpperCase()}</p>
                <p className="font-semibold text-gray-900 mt-1">${Number(o.total).toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                {o.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return <Suspense><OrdersList /></Suspense>;
}
