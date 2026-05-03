import { Table, Order, MenuItem, Category, Customer, Earning } from "@/types";

import axios from "axios";

const API_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN;
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE;

if (!API_ORIGIN || !API_BASE_URL) {
  throw new Error(
    "Missing VITE_BACKEND_ORIGIN or VITE_BACKEND_API_BASE in Frontend/.env"
  );
}

const ENDPOINTS = {
  auth: {
    token: "/user/token/",
    register: "/user/register/",
    profile: "/user/profile/",
  },
  tables: "/tables/",
  tableById: (tableId: string) => `/tables/${tableId}/`,
  tableBook: (tableId: string) => `/tables/${tableId}/book/`,
  categories: "/categories/",
  dishes: "/dishes/",
  orders: "/orders/",
  orderById: (orderId: string) => `/orders/${orderId}/`,
  earnings: "/earnings/",
};

/* ================= AXIOS INSTANCE ================= */
const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;

/* ================= AUTH ================= */

export const signIn = async (credentials: any) => {
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.auth.token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    throw new Error("Sign in failed");
  }
  return response.json();
};

export const signUp = async (userData: any) => {
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.auth.register}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.email?.[0] || data?.detail || "Sign up failed";
    throw new Error(message);
  }
  return data;
};

export const updateProfile = (data: any) => {
  const token = localStorage.getItem("accessToken");

  return fetch(`${API_BASE_URL}${ENDPOINTS.auth.profile}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

/* ================= TABLES ================= */

type TableApi = {
  id: number | string;
  table_number: string;
  seats: number;
  status: "Available" | "Booked" | "Occupied";
  customer_name?: string | null;
  booking_time?: string | null;
};

type CategoryApi = {
  id: number;
  name: string;
};

type DishApi = {
  id: number;
  name: string;
  description: string;
  price: string | number;
  category: number;
  is_veg: boolean;
};

type OrderItemApi = {
  id: number;
  dish: number;
  dish_name: string;
  quantity: number;
  price: string | number;
};

type OrderApi = {
  id: number;
  table: number | null;
  customer_name: string;
  status: "Pending" | "In Progress" | "Ready" | "Completed" | "Cancelled";
  order_type: "Dine In" | "Takeaway";
  created_at: string;
  total_amount: string | number;
  items: OrderItemApi[];
};

type EarningApi = {
  id: number;
  order?: number | null;
  date?: string | null;
  completed_at?: string | null;
  amount: string | number;
};

const toTimeString = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toBookingDateTime = (time: string | undefined) => {
  if (!time) return null;
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toISOString();
};

const mapTableFromApi = (table: TableApi): Table => ({
  id: String(table.id),
  number: Number.parseInt(String(table.table_number), 10),
  status: table.status,
  customer: table.customer_name || undefined,
  seats: table.seats,
  reservationTime: table.booking_time
    ? new Date(table.booking_time).toLocaleString()
    : undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mapTableToApi = (
  data: Partial<Omit<Table, "id" | "createdAt" | "updatedAt">>
) => {
  const payload: Record<string, unknown> = {};

  if (data.number !== undefined) payload.table_number = String(data.number);
  if (data.seats !== undefined) payload.seats = data.seats;
  if (data.status !== undefined) payload.status = data.status;
  if (data.customer !== undefined)
    payload.customer_name = data.customer ?? null;

  if (data.reservationTime !== undefined) {
    payload.booking_time = data.reservationTime
      ? toBookingDateTime(data.reservationTime)
      : null;
  }

  return payload;
};

const mapCategoryFromApi = (category: CategoryApi): Category => ({
  id: String(category.id),
  name: category.name,
});

const mapDishFromApi = (dish: DishApi): MenuItem => ({
  id: String(dish.id),
  name: dish.name,
  price: Number(dish.price),
  category: "",
  categoryId: dish.category,
  description: dish.description,
  available: true,
  preparationTime: 20,
  isVeg: dish.is_veg,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mapOrderFromApi = (order: OrderApi, tables: Table[]): Order => {
  const table = tables.find((item) => item.id === String(order.table));
  const tableNumber = table ? table.number : 0;
  const customerInitials = order.customer_name
    .split(" ")
    .map((name) => name.charAt(0).toUpperCase())
    .join("");

  return {
    id: String(order.id),
    customerName: order.customer_name,
    customerInitials,
    tableNumber,
    tableId: order.table ? String(order.table) : undefined,
    items: order.items.map((item) => ({
      id: String(item.id),
      dishId: String(item.dish),
      name: item.dish_name,
      price: Number(item.price),
      quantity: item.quantity,
      category: "",
    })),
    status: order.status,
    totalAmount: Number(order.total_amount),
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.created_at),
    orderType: order.order_type,
  };
};

const mapEarningFromApi = (earning: EarningApi): Earning => ({
  id: String(earning.id),
  orderId: earning.order ? String(earning.order) : undefined,
  date: earning.date || undefined,
  completedAt: earning.completed_at
    ? new Date(earning.completed_at)
    : undefined,
  amount: Number(earning.amount),
});

export const getTables = async (): Promise<Table[]> => {
  const response = await api.get(ENDPOINTS.tables);
  return response.data.map(mapTableFromApi);
};

export const addTable = async (
  tableData: Omit<Table, "id" | "createdAt" | "updatedAt">
): Promise<Table> => {
  const response = await api.post(ENDPOINTS.tables, mapTableToApi(tableData));
  return mapTableFromApi(response.data);
};

export const updateTable = async (
  tableId: string,
  updates: Partial<Omit<Table, "id" | "createdAt" | "updatedAt">>
): Promise<Table> => {
  const response = await api.patch(
    ENDPOINTS.tableById(tableId),
    mapTableToApi(updates)
  );
  return mapTableFromApi(response.data);
};

export const deleteTable = async (tableId: string): Promise<void> => {
  await api.delete(ENDPOINTS.tableById(tableId));
};

export const bookTable = async (
  tableId: string,
  customerName: string,
  reservationDateTime: string
): Promise<Table> => {
  const bookingTime = new Date(reservationDateTime).toISOString();

  const response = await api.post(ENDPOINTS.tableBook(tableId), {
    customer_name: customerName,
    booking_time: bookingTime,
  });

  return mapTableFromApi(response.data);
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get(ENDPOINTS.categories);
  return response.data.map(mapCategoryFromApi);
};

export const getMenuItems = async (): Promise<MenuItem[]> => {
  const response = await api.get(ENDPOINTS.dishes);
  return response.data.map(mapDishFromApi);
};

export const addMenuItem = async (
  itemData: Omit<MenuItem, "id" | "createdAt" | "updatedAt">
): Promise<MenuItem> => {
  const payload = {
    name: itemData.name,
    description: itemData.description || "",
    price: itemData.price,
    category: itemData.categoryId,
    is_veg: itemData.isVeg ?? true,
  };
  const response = await api.post(ENDPOINTS.dishes, payload);
  return mapDishFromApi(response.data);
};

export const addCategory = async (
  categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">
): Promise<Category> => {
  const response = await api.post(ENDPOINTS.categories, {
    name: categoryData.name,
  });
  return mapCategoryFromApi(response.data);
};

export const getCustomers = async () => {
  // FIX: added missing API method to match useRestaurantData hook
  const res = await api.get("/customers/");
  return res.data;
};

export const getOrders = async (tables: Table[]): Promise<Order[]> => {
  const response = await api.get(ENDPOINTS.orders);
  return response.data.map((order: OrderApi) => mapOrderFromApi(order, tables));
};

export const getEarnings = async (): Promise<Earning[]> => {
  const response = await api.get(ENDPOINTS.earnings);
  return response.data.map(mapEarningFromApi);
};

export const addOrder = async (
  orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
): Promise<Order> => {
  const payload = {
    table: orderData.tableId ? Number(orderData.tableId) : null,
    customer_name: orderData.customerName,
    status: orderData.status,
    order_type: orderData.orderType,
    items: orderData.items.map((item) => ({
      dish: Number(item.dishId || item.id),
      quantity: item.quantity,
    })),
  };

  try {
    const response = await api.post(ENDPOINTS.orders, payload);
    return mapOrderFromApi(response.data, []);
  } catch (error: any) {
    if (error?.response?.data) {
      console.error("Order create error:", error.response.data);
    }
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: Order["status"]
): Promise<void> => {
  await api.patch(ENDPOINTS.orderById(orderId), { status });
};

export const updateOrderItems = async (
  orderId: string,
  items: { dishId: string; quantity: number }[]
): Promise<Order> => {
  const payload = {
    items: items.map((item) => ({
      dish: Number(item.dishId),
      quantity: item.quantity,
    })),
  };

  const response = await api.patch(ENDPOINTS.orderById(orderId), payload);
  return mapOrderFromApi(response.data, []);
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  await api.delete(ENDPOINTS.orderById(orderId));
};
