import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Order, OrderItem, MenuItem, Table } from '@/types';

interface AddOrderFormProps {
  onAddOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  menuItems: MenuItem[];
  tables: Table[];
}

export function AddOrderForm({ onAddOrder, menuItems, tables }: AddOrderFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    tableId: '',
    orderType: 'Dine In' as Order['orderType'],
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('');

  const availableTables = tables
    .filter(table => table.status === 'Available')
    .sort((a, b) => a.number - b.number);

  const menuItemsByCategory = menuItems.reduce((acc, item) => {
    const key = item.category || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const sortedMenuCategories = Object.keys(menuItemsByCategory).sort((a, b) => a.localeCompare(b));
  sortedMenuCategories.forEach(category => {
    menuItemsByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
  });

  const addItemToOrder = () => {
    const menuItem = menuItems.find(item => item.id === selectedMenuItem);
    if (!menuItem) return;

    const existingItem = orderItems.find(item => item.id === menuItem.id);
    if (existingItem) {
      setOrderItems(prev => prev.map(item => 
        item.id === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newOrderItem: OrderItem = {
        id: menuItem.id,
        dishId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        category: menuItem.category,
      };
      setOrderItems(prev => [...prev, newOrderItem]);
    }
    setSelectedMenuItem('');
  };

  const updateItemQuantity = (itemId: string, change: number) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + change);
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if ((formData.orderType === 'Dine In' && !formData.tableId) || (formData.orderType === 'Takeaway' && !formData.customerName) || orderItems.length === 0) {
      return;
    }

    const customerName = formData.orderType === 'Dine In' ? 'Walk-in' : formData.customerName;
    const customerInitials = customerName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('');

    const tableNumber = formData.tableId
      ? (tables.find(table => table.id === formData.tableId)?.number || 0)
      : 0;

    const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
      customerName,
      customerInitials,
      tableNumber,
      tableId: formData.tableId || undefined,
      orderType: formData.orderType,
      items: orderItems,
      status: 'Pending',
      totalAmount,
    };

    onAddOrder(orderData);
    setOpen(false);

    setFormData({
      customerName: '',
      tableId: '',
      orderType: 'Dine In',
    });
    setOrderItems([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-restaurant-green hover:bg-restaurant-green/90">
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderType" className="text-foreground">Order Type</Label>
              <Select value={formData.orderType} onValueChange={(value: Order['orderType']) => 
                setFormData(prev => ({ ...prev, orderType: value }))
              }>
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Dine In">Dine In</SelectItem>
                  <SelectItem value="Takeaway">Takeaway</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.orderType === 'Takeaway' ? (
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-foreground">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="bg-card border-border text-foreground"
                  required
                />
              </div>
            ) : null}
          </div>

          {formData.orderType === 'Dine In' && (
            <div className="space-y-2">
              <Label htmlFor="tableNumber" className="text-foreground">Table</Label>
              <Select value={formData.tableId} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, tableId: value }))
              }>
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.number} ({table.seats} seats)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-foreground">Add Items</Label>
            <div className="flex gap-2">
              <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
                <SelectTrigger className="flex-1 bg-card border-border text-foreground">
                  <SelectValue placeholder="Select menu item" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {sortedMenuCategories.map(category => (
                    <SelectGroup key={category}>
                      <SelectLabel className="text-xs uppercase tracking-wider text-restaurant-blue/90 bg-restaurant-blue/10 px-2 py-1 rounded-md">
                        {category}
                      </SelectLabel>
                      {menuItemsByCategory[category].map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - Rs. {item.price}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={addItemToOrder}
                disabled={!selectedMenuItem}
                className="bg-restaurant-blue hover:bg-restaurant-blue/90"
              >
                Add
              </Button>
            </div>
          </div>

          {orderItems.length > 0 && (
            <div className="space-y-2">
              <Label className="text-foreground">Order Items</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {orderItems.map((item) => (
                  <Card key={item.id} className="bg-card border-border">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{item.name}</div>
                          <div className="text-sm text-muted-foreground">Rs. {item.price} each</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-foreground font-medium">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <div className="text-foreground font-medium min-w-16 text-right">
                            Rs. {item.price * item.quantity}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">
                  Total: Rs. {totalAmount}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-restaurant-green hover:bg-restaurant-green/90"
              disabled={orderItems.length === 0}
            >
              Create Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
