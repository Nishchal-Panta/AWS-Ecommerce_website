// API client for AWS e-commerce backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://150ouvhn24.execute-api.ap-south-1.amazonaws.com/prod';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, headers = {}, token } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = \Bearer \;
  }

  const response = await fetch(\\, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(\API Error: \ \A parameter cannot be found that matches parameter name 'Chord'. A parameter cannot be found that matches parameter name 'Chord'. A parameter cannot be found that matches parameter name 'Chord'. A parameter cannot be found that matches parameter name 'Chord'.\);
  }

  const data = await response.json();
  return data;
}

// ===== PRODUCTS =====

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
}

export async function getProducts(category?: string): Promise<Product[]> {
  const endpoint = category ? \/products?category=\ : '/products';
  return apiCall(endpoint);
}

export async function getProduct(productId: string): Promise<Product> {
  return apiCall(\/products/\);
}

export async function createProduct(product: Omit<Product, 'id'>, token: string): Promise<Product> {
  return apiCall('/products', { method: 'POST', body: product, token });
}

export async function updateProduct(productId: string, updates: Partial<Product>, token: string): Promise<Product> {
  return apiCall(\/products/\, { method: 'PUT', body: updates, token });
}

export async function deleteProduct(productId: string, token: string): Promise<void> {
  await apiCall(\/products/\, { method: 'DELETE', token });
}

// ===== CART =====

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export async function getCart(token: string): Promise<Cart> {
  return apiCall('/cart', { token });
}

export async function updateCart(cart: Cart, token: string): Promise<Cart> {
  return apiCall('/cart', { method: 'PUT', body: cart, token });
}

export async function clearCart(token: string): Promise<void> {
  await apiCall('/cart', { method: 'DELETE', token });
}

export async function addToCart(item: CartItem, token: string): Promise<Cart> {
  const cart = await getCart(token);
  const existingItem = cart.items.find(i => i.productId === item.productId);
  
  if (existingItem) {
    existingItem.quantity += item.quantity;
  } else {
    cart.items.push(item);
  }
  
  cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return updateCart(cart, token);
}

export async function removeFromCart(productId: string, token: string): Promise<Cart> {
  const cart = await getCart(token);
  cart.items = cart.items.filter(i => i.productId !== productId);
  cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return updateCart(cart, token);
}

// ===== ORDERS =====

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: number;
  updatedAt?: number;
}

export async function getOrders(token: string): Promise<Order[]> {
  return apiCall('/orders', { token });
}

export async function getOrder(orderId: string, token: string): Promise<Order> {
  return apiCall(\/orders/\, { token });
}

export async function createOrder(items: CartItem[], total: number, token: string): Promise<Order> {
  return apiCall('/orders', { method: 'POST', body: { items, total }, token });
}

export async function updateOrderStatus(orderId: string, status: string, token: string): Promise<Order> {
  return apiCall(\/orders/\, { method: 'PUT', body: { status }, token });
}

// ===== AUTH =====

export interface AuthConfig {
  userPoolId: string;
  clientId: string;
  domain: string;
  region: string;
  redirectUri: string;
}

export interface AuthUser {
  userId: string;
  email: string;
}

export async function getAuthConfig(): Promise<AuthConfig> {
  return apiCall('/auth/config');
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  return apiCall('/auth/user', { token });
}

export async function refreshToken(token: string): Promise<{ token: string }> {
  return apiCall('/auth/refresh', { method: 'POST', body: { token } });
}
