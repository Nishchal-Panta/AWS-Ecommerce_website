"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCartStore } from "@/lib/store";
import Link from "next/link";

type Product = { id: string; name: string; description: string; price: number; category: string; imageUrl?: string; stock: number; };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [category, setCategory] = useState("");
  const [added, setAdded]       = useState<string | null>(null);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    setLoading(true);
    const url = category ? `/products?category=${category}` : "/products";
    api.get<{ products: Product[] }>(url)
      .then(d => setProducts(d.products))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [category]);

  const categories = [...new Set(products.map(p => p.category))];

  function handleAdd(p: Product) {
    addItem({ productId: p.id, name: p.name, price: p.price, quantity: 1, imageUrl: p.imageUrl });
    setAdded(p.id);
    setTimeout(() => setAdded(null), 1500);
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading products...</div>;
  if (error)   return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategory("")} className={`px-3 py-1 rounded-full text-sm border ${!category ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600"}`}>All</button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded-full text-sm border ${category === c ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600"}`}>{c}</button>
          ))}
        </div>
      </div>
      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No products found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition overflow-hidden">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" /> : <span className="text-5xl">📦</span>}
              </div>
              <div className="p-5">
                <span className="text-xs text-indigo-500 font-medium uppercase tracking-wide">{p.category}</span>
                <h3 className="font-semibold text-gray-900 mt-1 mb-1">{p.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">${p.price.toFixed(2)}</span>
                  <button onClick={() => handleAdd(p)} disabled={p.stock === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${added === p.id ? "bg-green-500 text-white" : p.stock === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                    {added === p.id ? "Added ✓" : p.stock === 0 ? "Out of stock" : "Add to cart"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
