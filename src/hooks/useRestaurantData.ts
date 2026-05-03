import { useState, useCallback, useEffect } from 'react';
import { Table, Order, MenuItem, Category, Customer, RestaurantStats, Earning } from '@/types';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';

export function useRestaurantData() {
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const tablesData = await api.getTables();
      const [ordersData, menuItemsData, categoriesData, customersData, earningsData] = await Promise.all([
        api.getOrders(tablesData),
        api.getMenuItems(),
        api.getCategories(),
        api.getCustomers(),
        api.getEarnings(),
      ]);

      const categoryMap = new Map(
        categoriesData.map(category => [Number(category.id), category.name])
      );

      const menuItemsWithCategory = menuItemsData.map(item => {
        const name = item.categoryId ? categoryMap.get(item.categoryId) : undefined;
        return {
          ...item,
          category: name || item.category || 'Uncategorized',
        };
      });

      const categoryCounts = menuItemsWithCategory.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const categoriesWithCounts = categoriesData.map(category => ({
        ...category,
        itemCount: categoryCounts[category.name] || 0,
      }));

      const dishCategoryMap = new Map(
        menuItemsWithCategory.map(item => [item.id, item.category])
      );

      const ordersWithCategory = ordersData.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          category: item.dishId ? dishCategoryMap.get(item.dishId) || item.category : item.category,
        })),
      }));

      setTables(tablesData);
      setOrders(ordersWithCategory);
      setMenuItems(menuItemsWithCategory);
      setCategories(categoriesWithCounts);
      setCustomers(customersData);
      setEarnings(earningsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading) {
      const calculatedStats: RestaurantStats = {
        totalEarnings: earnings.reduce((sum, item) => sum + item.amount, 0),
        inProgressOrders: orders.filter(order => order.status === 'In Progress').length,
        totalCustomers: customers.length,
        eventCount: 20000,
        totalCategories: categories.length,
        totalDishes: menuItems.length,
        activeOrders: orders.filter(order => ['Pending', 'In Progress'].includes(order.status)).length,
        totalTables: tables.length,
      };
      setStats(calculatedStats);
    }
  }, [loading, orders, customers, categories, menuItems, tables, earnings]);

  const addTable = useCallback(async (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (tables.some(table => table.number === tableData.number)) {
        toast({
          title: "Table already exists",
          description: "Please change the table number and try again.",
          variant: "destructive",
        });
        return;
      }
      const newTable = await api.addTable(tableData);
      setTables(prev => [...prev, newTable]);
      toast({ title: "Table Added", description: `Table ${newTable.number} has been added.` });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add table.", variant: "destructive" });
    }
  }, [toast, fetchData, tables]);

  const updateTable = useCallback(async (
    tableId: string,
    updates: Partial<Omit<Table, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    try {
      const updatedTable = await api.updateTable(tableId, updates);
      setTables(prev => prev.map(table => table.id === tableId ? updatedTable : table));
      toast({ title: "Table Updated", description: `Table ${updatedTable.number} updated.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update table.", variant: "destructive" });
    }
  }, [toast]);

  const deleteTable = useCallback(async (tableId: string) => {
    try {
      await api.deleteTable(tableId);
      setTables(prev => prev.filter(table => table.id !== tableId));
      toast({ title: "Table Deleted", description: "Table has been removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete table.", variant: "destructive" });
    }
  }, [toast]);

  const bookTable = useCallback(async (tableId: string, customerName: string, reservationDateTime: string) => {
    try {
      const updatedTable = await api.bookTable(tableId, customerName, reservationDateTime);
      setTables(prev => prev.map(table => table.id === tableId ? updatedTable : table));
      toast({ title: "Table Booked", description: `Table ${updatedTable.number} has been booked.` });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to book table.", variant: "destructive" });
    }
  }, [toast, fetchData]);

  const addOrder = useCallback(async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (orderData.orderType === 'Dine In' && orderData.tableId) {
        const existingOrder = orders.find(order =>
          order.tableId === orderData.tableId &&
          order.status !== 'Completed' &&
          order.status !== 'Cancelled'
        );

        if (existingOrder) {
          const mergedItems = [...existingOrder.items];
          orderData.items.forEach(item => {
            const dishId = item.dishId || item.id;
            const existingItem = mergedItems.find(existing => (existing.dishId || existing.id) === dishId);
            if (existingItem) {
              existingItem.quantity += item.quantity;
            } else {
              mergedItems.push({ ...item, dishId, id: String(dishId) });
            }
          });

          await api.updateOrderItems(existingOrder.id, mergedItems.map(item => ({
            dishId: String(item.dishId || item.id),
            quantity: item.quantity,
          })));

          toast({ title: "Order Updated", description: `Order for Table ${existingOrder.tableNumber} updated.` });
          fetchData();
          return;
        }
      }

      const newOrder = await api.addOrder(orderData);
      setOrders(prev => [...prev, newOrder]);
      toast({ title: "Order Added", description: `Order for ${newOrder.customerName} has been added.` });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add order.", variant: "destructive" });
    }
  }, [toast, fetchData, orders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    try {
      const order = orders.find(item => item.id === orderId);
      await api.updateOrderStatus(orderId, status);

      if (status === 'Cancelled' && order?.tableId) {
        await api.updateTable(order.tableId, {
          status: 'Available',
          customer: undefined,
          reservationTime: undefined,
        });
        setTables(prev => prev.map(table =>
          table.id === order.tableId
            ? { ...table, status: 'Available', customer: undefined, reservationTime: undefined }
            : table
        ));
      }

      setOrders(prev => prev.map(orderItem => orderItem.id === orderId ? { ...orderItem, status } : orderItem));
      toast({ title: "Order Updated", description: "Order status updated." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
    }
  }, [toast, orders, fetchData]);

  const completeOrderPayment = useCallback(async (orderId: string) => {
    try {
      const order = orders.find(item => item.id === orderId);
      await api.updateOrderStatus(orderId, 'Completed');
      if (order?.tableId) {
        await api.updateTable(order.tableId, {
          status: 'Available',
          customer: undefined,
          reservationTime: undefined,
        });
      }
      setOrders(prev => prev.map(item => item.id === orderId ? { ...item, status: 'Completed' } : item));
      if (order?.tableId) {
        setTables(prev => prev.map(table => table.id === order.tableId ? { ...table, status: 'Available', customer: undefined, reservationTime: undefined } : table));
      }
      toast({ title: "Payment Done", description: "Order completed and table freed." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete payment.", variant: "destructive" });
    }
  }, [orders, toast, fetchData]);

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      const order = orders.find(item => item.id === orderId);
      await api.deleteOrder(orderId);
      setOrders(prev => prev.filter(item => item.id !== orderId));

      if (order?.tableId) {
        await api.updateTable(order.tableId, {
          status: 'Available',
          customer: undefined,
          reservationTime: undefined,
        });
        setTables(prev => prev.map(table =>
          table.id === order.tableId
            ? { ...table, status: 'Available', customer: undefined, reservationTime: undefined }
            : table
        ));
      }

      toast({ title: "Order Deleted", description: "Order removed." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete order.", variant: "destructive" });
    }
  }, [toast, orders, fetchData]);

  const updateOrderItems = useCallback(async (orderId: string, items: { dishId: string; quantity: number }[]) => {
    try {
      const updatedOrder = await api.updateOrderItems(orderId, items);
      setOrders(prev => prev.map(order => order.id === orderId ? updatedOrder : order));
      toast({ title: "Order Updated", description: "Order items updated." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update order items.", variant: "destructive" });
    }
  }, [toast, fetchData]);

  const addMenuItem = useCallback(async (itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newItem = await api.addMenuItem(itemData);
      setMenuItems(prev => [...prev, newItem]);
      toast({ title: "Menu Item Added", description: `${newItem.name} has been added.` });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add menu item.", variant: "destructive" });
    }
  }, [toast, fetchData]);

  const addCategory = useCallback(async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCategory = await api.addCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
      toast({ title: "Category Added", description: `${newCategory.name} has been added.` });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add category.", variant: "destructive" });
    }
  }, [toast, fetchData]);

  const getOrdersByStatus = useCallback((status?: Order['status']) => {
    return status ? orders.filter(order => order.status === status) : orders;
  }, [orders]);

  const getTablesByStatus = useCallback((status?: Table['status']) => {
    return status ? tables.filter(table => table.status === status) : tables;
  }, [tables]);

  const getMenuItemsByCategory = useCallback((category?: string) => {
    return category ? menuItems.filter(item => item.category === category) : menuItems;
  }, [menuItems]);

  return {
    tables,
    orders,
    menuItems,
    categories,
    customers,
    earnings,
    stats,
    loading,
    addTable,
    updateTable,
    deleteTable,
    bookTable,
    addOrder,
    updateOrderStatus,
    completeOrderPayment,
    deleteOrder,
    updateOrderItems,
    addMenuItem,
    addCategory,
    getOrdersByStatus,
    getTablesByStatus,
    getMenuItemsByCategory,
  };
}
