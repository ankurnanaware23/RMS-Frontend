export interface Table {
  id: string;
  number: number;
  status: "Available" | "Booked" | "Occupied";
  customer?: string;
  seats: number;
  reservationTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  customerName: string;
  customerInitials: string;
  tableNumber: number;
  tableId?: string;
  items: OrderItem[];
  status: "Pending" | "In Progress" | "Ready" | "Completed" | "Cancelled";
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  orderType: "Dine In" | "Takeaway";
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  dishId?: string;
  notes?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  categoryId?: number;
  description?: string;
  image?: string;
  available: boolean;
  preparationTime: number;
  isVeg?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  itemCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantStats {
  totalEarnings: number;
  inProgressOrders: number;
  totalCustomers: number;
  eventCount: number;
  totalCategories: number;
  totalDishes: number;
  activeOrders: number;
  totalTables: number;
}

export interface Earning {
  id: string;
  orderId?: string;
  date?: string;
  completedAt?: Date;
  amount: number;
}
