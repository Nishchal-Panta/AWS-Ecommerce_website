"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const count = useCartStore(s => s.count());

  useEffect(() => {
    setMounted(true);
    // TODO: Re-enable Amplify auth when stable
  }, []);

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">ShopAWS</Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/products" className="text-gray-600 hover:text-indigo-600">Products</Link>
          <Link href="/cart" className="relative">
            <span className="text-2xl">🛒</span>
            {count > 0 && mounted && (
              <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{count}</span>
            )}
          </Link>
          <Link href="/auth/login" className="text-gray-600 hover:text-indigo-600">Sign in</Link>
        </div>
      </div>
    </nav>
  );
}