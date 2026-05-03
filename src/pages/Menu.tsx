import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Minus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurantData } from "@/hooks/useRestaurantData";

const categoryPalette = [
  { color: "bg-restaurant-red" },
  { color: "bg-restaurant-purple" },
  { color: "bg-restaurant-blue" },
  { color: "bg-restaurant-brown" },
  { color: "bg-restaurant-green" },
  { color: "bg-restaurant-orange" },
  { color: "bg-restaurant-purple" },
  { color: "bg-restaurant-blue" },
];

const VegIcon = () => (
  <div className="w-6 h-6 flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <rect x="2" y="2" width="20" height="20" rx="2" ry="2" fill="none" stroke="green" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" fill="green" />
    </svg>
  </div>
);

const NonVegIcon = () => (
  <div className="w-6 h-6 flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <rect x="2" y="2" width="20" height="20" rx="2" ry="2" fill="none" stroke="red" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" fill="red" />
    </svg>
  </div>
);

const getCategoryLabel = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.map(part => part[0]).join('').slice(0, 3).toUpperCase();
};

export default function Menu() {
  const navigate = useNavigate();
  const { menuItems, categories, tables, addOrder, loading } = useRestaurantData();

  const [quantities, setQuantities] = useState<{ [tableId: string]: { [key: string]: number } }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (tables.length > 0 && !selectedTableId) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

  const categoriesWithMeta = useMemo(() => {
    return categories.map((category, index) => {
      const palette = categoryPalette[index % categoryPalette.length];
      const count = menuItems.filter(item => item.category === category.name).length;
      const nameKey = category.name.toLowerCase();
      const emojiByName: Record<string, string> = {
        starters: "🥟",
        main_course: "🍽️",
        soups: "🍜",
        rice_and_biryani: "🍚",
        breads: "🥖",
        chinese: "🥢",
        fast_food: "🍔",
        beverages: "🥤",
        desserts: "🍰",
        salads: "🥗",
        pizzas: "🍕",
      };
      const normalizedKey = nameKey
        .replace(/&/g, "and")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\s+/g, "_");
      return {
        ...category,
        label: getCategoryLabel(category.name),
        color: category.color || palette.color,
        emoji:
          category.emoji ||
          emojiByName[normalizedKey] ||
          emojiByName[normalizedKey + "s"] ||
          "🍽️",
        itemCount: category.itemCount ?? count,
      };
    });
  }, [categories, menuItems]);

  const sortedTables = useMemo(
    () => [...tables].sort((a, b) => a.number - b.number),
    [tables]
  );

  const itemsForCategory = useMemo(() => {
    if (searchTerm.trim()) {
      const needle = searchTerm.toLowerCase();
      return menuItems.filter(item => item.name.toLowerCase().includes(needle));
    }
    return menuItems.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory, searchTerm]);

  const vegItems = itemsForCategory
    .filter(item => item.isVeg !== false)
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const nonVegItems = itemsForCategory
    .filter(item => item.isVeg === false)
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const updateQuantity = (itemName: string, change: number) => {
    if (!selectedTableId) return;
    setQuantities(prev => ({
      ...prev,
      [selectedTableId]: {
        ...prev[selectedTableId],
        [itemName]: Math.max(0, ((prev[selectedTableId] && prev[selectedTableId][itemName]) || 0) + change),
      },
    }));
  };

  const selectedTable = tables.find(table => table.id === selectedTableId);

  const currentOrderItems = Object.entries((quantities[selectedTableId] || {}))
    .map(([name, quantity]) => {
      const item = menuItems.find(menuItem => menuItem.name === name);
      return { name, quantity, price: item ? item.price * quantity : 0, dishId: item?.id };
    })
    .filter(item => item.quantity > 0);

  const subtotal = currentOrderItems.reduce((acc, item) => acc + item.price, 0);
  const total = subtotal;

  const handlePlaceOrder = () => {
    if (!selectedTableId || currentOrderItems.length === 0) return;

    const orderItems = currentOrderItems.map(item => ({
      id: item.dishId || item.name,
      dishId: item.dishId,
      name: item.name,
      price: item.price / item.quantity,
      quantity: item.quantity,
      category: '',
    }));

    addOrder({
      customerName: 'Walk-in',
      customerInitials: 'WI',
      tableNumber: selectedTable ? selectedTable.number : 0,
      tableId: selectedTableId,
      orderType: 'Dine In',
      items: orderItems,
      status: 'Pending',
      totalAmount: total,
    });

    setQuantities(prev => ({ ...prev, [selectedTableId]: {} }));
  };

  if (loading) {
    return <div className="p-4 max-w-7xl mx-auto">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-restaurant-blue"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Menu</h1>
                <p className="text-xs text-muted-foreground">{menuItems.length} items</p>
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedTableId} onValueChange={setSelectedTableId} disabled={tables.length === 0}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder={tables.length === 0 ? "No tables" : "Select Table"} />
                </SelectTrigger>
                <SelectContent>
                  {sortedTables.map(table => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all dishes..."
              className="pl-10 bg-card border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {categoriesWithMeta.map((category) => (
              <Card
                key={category.name}
                className={`${category.color} border-0 cursor-pointer hover:opacity-90 transition-opacity ${selectedCategory === category.name ? 'ring-2 ring-white' : ''}`}
                onClick={() => setSelectedCategory(category.name)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-1">{category.emoji}</div>
                  <div className="text-white font-semibold text-sm mb-1">{category.name}</div>
                  <div className="text-white/80 text-xs">{category.itemCount || 0} Items</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            {vegItems.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <VegIcon />
                  <h2 className="text-xl font-bold text-foreground">Veg</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vegItems.map((item) => (
                    <Card key={item.id} className="bg-card border-border">
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground mb-2">{item.name}</h3>
                            <span className="text-xs text-restaurant-green">Veg</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                          )}
                          <div className="text-xl font-bold text-foreground">Rs. {item.price}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.name, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {(quantities[selectedTableId] && quantities[selectedTableId][item.name]) || 0}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.name, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {nonVegItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <NonVegIcon />
                  <h2 className="text-xl font-bold text-foreground">Non-Veg</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nonVegItems.map((item) => (
                    <Card key={item.id} className="bg-card border-border">
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground mb-2">{item.name}</h3>
                            <span className="text-xs text-restaurant-red">Non-Veg</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                          )}
                          <div className="text-xl font-bold text-foreground">Rs. {item.price}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.name, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {(quantities[selectedTableId] && quantities[selectedTableId][item.name]) || 0}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.name, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {vegItems.length === 0 && nonVegItems.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">No items found.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-card border-border sticky top-4">
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-foreground">Order Details</h3>
                <div className="text-xs text-muted-foreground mt-1">
                  Table No: {selectedTable ? selectedTable.number : '-'}
                </div>
                <div className="border-t border-border mt-3"></div>

                <div className="space-y-3 mt-4">
                  {currentOrderItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-foreground">{item.name}</div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-foreground">Rs. {item.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Items({currentOrderItems.reduce((acc, item) => acc + item.quantity, 0)})</span>
                  <span className="text-sm font-medium">Rs. {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>Rs. {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handlePlaceOrder}
                  disabled={!selectedTableId || currentOrderItems.length === 0}
                >
                  Place Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
