import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        Welcome to <span className="text-indigo-600">ShopAWS</span>
      </h1>
      <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
        A full-stack e-commerce platform built entirely on AWS free tier.
      </p>
      <Link href="/products" className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition">
        Browse Products
      </Link>
    </div>
  );
}