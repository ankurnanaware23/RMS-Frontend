import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Card, CardContent } from "@/components/ui/card";

export default function AllDishes() {
  const { orders } = useRestaurantData();

  const dishCounts = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const popularDishes = Object.entries(dishCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count], index) => ({
      rank: (index + 1).toString().padStart(2, '0'),
      name,
      orders: count.toString(),
      image: "🍽️", // Default emoji
    }));

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">All Popular Dishes</h1>
      <div className="space-y-3">
        {popularDishes.map((dish) => (
          <Card key={dish.rank} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold text-muted-foreground">{dish.rank}</div>
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-lg">
                  {dish.image}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{dish.name}</div>
                  <div className="text-sm text-muted-foreground">Orders: {dish.orders}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
