import { useMemo, useState } from 'react';
import { Link } from "react-router-dom";
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AllOrders() {
  const { orders } = useRestaurantData();
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed' | 'Cancelled'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Dine In' | 'Takeaway'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusLabel = (status: string) => {
    if (status === 'Pending') return 'On Going';
    return status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-restaurant-orange';
      case 'Completed':
        return 'bg-restaurant-green';
      case 'Cancelled':
        return 'bg-restaurant-red';
      default:
        return 'bg-muted';
    }
  };

  const filteredOrders = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return orders.filter(order => {
      if (statusFilter !== 'All' && order.status !== statusFilter) return false;
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
  }, [orders, statusFilter, typeFilter, startDate, endDate, searchTerm]);

  const totalIncome = useMemo(() => {
    return filteredOrders.reduce((sum, order) => (
      order.status === 'Completed' ? sum + order.totalAmount : sum
    ), 0);
  }, [filteredOrders]);

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">All Orders</h1>
        <Link
          to="/orders?tab=all"
          className="text-sm text-restaurant-blue hover:underline"
        >
          View detailed Orders
        </Link>
      </div>
      <div className="flex flex-wrap lg:flex-nowrap items-end gap-3">
        <div className="space-y-1 min-w-[180px]">
          <div className="text-xs text-muted-foreground">Order Status</div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Pending">On Going</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

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

      <Card className="bg-card border-border">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Total Income</div>
          <div className="text-lg font-semibold text-foreground">Rs. {totalIncome.toFixed(2)}</div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold">
                    {order.customerInitials}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{order.customerName}</div>
                    <div className="text-sm text-muted-foreground">{order.items.length} Items</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {order.createdAt.toLocaleString('en-GB', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {order.orderType === 'Dine In' ? (
                    <Badge className="bg-restaurant-orange text-white mb-1">Table No: {order.tableNumber}</Badge>
                  ) : (
                    <Badge className="bg-restaurant-blue text-white mb-1">{order.orderType}</Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 ${getStatusColor(order.status)} rounded-full`}></div>
                      <span className="text-sm text-muted-foreground">{getStatusLabel(order.status)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground mt-2">
                    {order.status === 'Completed' ? `Rs. ${order.totalAmount.toFixed(2)}` : 'Cancelled'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredOrders.length === 0 && (
          <div className="text-sm text-muted-foreground">No orders match the selected filters.</div>
        )}
      </div>
    </div>
  );
}
