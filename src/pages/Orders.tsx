import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CheckCircle, XCircle, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { toast } from "sonner";
import { AddOrderForm } from '@/components/forms/AddOrderForm';
import { Order } from '@/types';

export default function Orders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    orders, 
    menuItems,
    tables,
    addOrder, 
    updateOrderStatus,
    completeOrderPayment,
    deleteOrder,
    updateOrderItems,
    getOrdersByStatus 
  } = useRestaurantData();
  const [activeFilter, setActiveFilter] = useState("Pending");
  const [typeFilter, setTypeFilter] = useState<'All' | 'Dine In' | 'Takeaway'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusLabel = (status: Order['status']) => {
    if (status === 'Pending') return 'On Going';
    return status;
  };
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<{ dishId: string; name: string; quantity: number; }[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [isEditingReadOnly, setIsEditingReadOnly] = useState(false);


  const orderStatuses = [
    { label: "Pending", display: "On Going", active: activeFilter === "Pending" },
    { label: "Completed", display: "Completed", active: activeFilter === "Completed" },
    { label: "Cancelled", display: "Cancelled", active: activeFilter === "Cancelled" },
    { label: "All", display: "All Orders", active: activeFilter === "All" },
  ];

  const filteredOrders = activeFilter === "All" ? orders : getOrdersByStatus(activeFilter as Order['status']);

  const filteredWithExtras = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return filteredOrders.filter(order => {
      if (typeFilter !== 'All' && order.orderType !== typeFilter) return false;
      if (start && order.createdAt < start) return false;
      if (end && order.createdAt > end) return false;

      if (needle) {
        const matchesId = String(order.id).toLowerCase().includes(needle);
        const matchesName = order.customerName.toLowerCase().includes(needle);
        if (!matchesId && !matchesName) return false;
      }
      return true;
    });
  }, [filteredOrders, typeFilter, startDate, endDate, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-restaurant-orange';
      case 'In Progress':
        return 'bg-restaurant-blue';
      case 'Ready':
        return 'bg-restaurant-green';
      case 'Completed':
        return 'bg-muted';
      case 'Cancelled':
        return 'bg-restaurant-red';
      default:
        return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
      case 'In Progress':
        return <Clock className="h-4 w-4" />;
      case 'Ready':
      case 'Completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'Cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus);
  };

  const handlePaymentDone = (orderId: string) => {
    completeOrderPayment(orderId);
  };

  const handleCancel = (orderId: string) => {
    toast("Do you want to cancel this order?", {
      action: {
        label: "Yes, cancel",
        onClick: () => updateOrderStatus(orderId, 'Cancelled'),
      },
      cancel: {
        label: "No",
        onClick: () => {},
      },
    });
  };

  const handleDelete = (orderId: string) => {
    toast("Do you want to delete this order?", {
      action: {
        label: "Yes, delete",
        onClick: () => deleteOrder(orderId),
      },
      cancel: {
        label: "No",
        onClick: () => {},
      },
    });
  };

  const handleOpenEdit = (order: Order) => {
    setEditingOrderId(order.id);
    setIsEditingReadOnly(order.status === 'Completed' || order.status === 'Cancelled');
    setEditingItems(order.items.map(item => ({
      dishId: item.dishId || item.id,
      name: item.name,
      quantity: item.quantity,
    })));
    setIsEditOpen(true);
  };

  const handleAddItem = () => {
    if (isEditingReadOnly) return;
    if (!selectedMenuItem) return;
    const menuItem = menuItems.find(item => item.id === selectedMenuItem);
    if (!menuItem) return;

    setEditingItems(prev => {
      const existing = prev.find(item => item.dishId === menuItem.id);
      if (existing) {
        return prev.map(item => item.dishId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { dishId: menuItem.id, name: menuItem.name, quantity: 1 }];
    });
    setSelectedMenuItem('');
  };

  const handleUpdateQuantity = (dishId: string, delta: number) => {
    if (isEditingReadOnly) return;
    setEditingItems(prev => prev
      .map(item => item.dishId === dishId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item)
      .filter(item => item.quantity > 0)
    );
  };

  const handleSaveItems = async () => {
    if (isEditingReadOnly) {
      setIsEditOpen(false);
      setEditingOrderId(null);
      setEditingItems([]);
      return;
    }
    if (!editingOrderId) return;
    await updateOrderItems(editingOrderId, editingItems.map(item => ({ dishId: item.dishId, quantity: item.quantity })));
    setIsEditOpen(false);
    setEditingOrderId(null);
    setEditingItems([]);
  };

  const sortedOrders = [...filteredWithExtras].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'all') setActiveFilter('All');
  }, [searchParams]);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="text-restaurant-blue"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          {orderStatuses.map((status) => (
            <Button
              key={status.label}
              variant={status.active ? "default" : "outline"}
              size="sm"
              className={status.active ? "bg-muted text-foreground" : "border-border"}
              onClick={() => setActiveFilter(status.label)}
            >
              {status.display} ({status.label === "All" ? orders.length : getOrdersByStatus(status.label as Order['status']).length})
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <AddOrderForm 
          onAddOrder={addOrder}
          menuItems={menuItems}
          tables={tables}
        />
      </div>

      <div className="flex flex-wrap lg:flex-nowrap items-end gap-3 mb-6">
        <div className="space-y-1 min-w-[180px]">
          <div className="text-xs text-muted-foreground">Order Type</div>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Dine In">Dine In</SelectItem>
              <SelectItem value="Takeaway">Takeaway</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 min-w-[200px]">
          <div className="text-xs text-muted-foreground">Start Date</div>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-card border-border"
          />
        </div>

        <div className="space-y-1 min-w-[200px]">
          <div className="text-xs text-muted-foreground">End Date</div>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-card border-border"
          />
        </div>

        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search with order no. or customer name"
            className="bg-card border-border pl-9"
          />
        </div>
      </div>

      <div className="flex justify-end text-sm text-muted-foreground mb-2">
        Total Orders ({sortedOrders.length})
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedOrders.map((order) => {
          const subtotal = order.items.reduce((sum, item) => sum + item.price, 0);
          const total = subtotal;

          return (
            <Card key={order.id} className="bg-card border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {order.customerInitials}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">ID: {order.id}</div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} text-white flex items-center gap-1`}>
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="text-foreground font-medium">{order.orderType}</span>
                  </div>
                  {order.orderType === 'Dine In' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Table:</span>
                      <span className="text-foreground font-medium">Table {order.tableNumber}</span>
                    </div>
                  )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="text-foreground font-medium">
                    {order.createdAt.toLocaleString('en-GB', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="text-foreground font-medium">{order.items.length} items</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.items.map(item => item.category).filter(Boolean).join(', ') || 'No categories'}
                  </div>
                </div>

                <div className="border-t border-border pt-3 mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>Rs. {total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleOpenEdit(order)}
                    >
                      {order.status === 'Completed' || order.status === 'Cancelled' ? 'View Ordered Items' : 'View / Edit'}
                    </Button>
                    {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-restaurant-red border-restaurant-red"
                        onClick={() => handleCancel(order.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                    <Button 
                      size="sm" 
                      onClick={() => handlePaymentDone(order.id)}
                      className="bg-restaurant-green hover:bg-restaurant-green/90 text-white w-full"
                    >
                      Payment Done
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No orders found for the selected filter.</p>
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Order Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!isEditingReadOnly && (
              <div className="flex gap-2">
                <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select menu item" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={handleAddItem} disabled={!selectedMenuItem}>Add</Button>
              </div>
            )}

            <div className="space-y-2">
              {editingItems.length === 0 && (
                <p className="text-sm text-muted-foreground">No items added yet.</p>
              )}
              {editingItems.map(item => (
                <div key={item.dishId} className="flex items-center justify-between border border-border rounded-md px-3 py-2">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="flex items-center gap-2">
                    {isEditingReadOnly ? (
                      <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                    ) : (
                      <>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleUpdateQuantity(item.dishId, -1)}>-</Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleUpdateQuantity(item.dishId, 1)}>+</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            {!isEditingReadOnly && (
              <Button type="button" onClick={handleSaveItems}>Save Changes</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
