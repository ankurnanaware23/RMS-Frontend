import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRestaurantData } from "@/hooks/useRestaurantData";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function OverallPerformance() {
  const { stats, orders, earnings, loading } = useRestaurantData();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const range = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    return { start, end };
  }, [startDate, endDate]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const createdAt = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
      if (Number.isNaN(createdAt.getTime())) return false;
      if (range.start && createdAt < range.start) return false;
      if (range.end && createdAt > range.end) return false;
      return true;
    });
  }, [orders, range]);

  const filteredEarnings = useMemo(() => {
    return earnings.filter(item => {
      const completedAt = item.completedAt instanceof Date ? item.completedAt : item.completedAt ? new Date(item.completedAt) : null;
      if (!completedAt || Number.isNaN(completedAt.getTime())) return false;
      if (range.start && completedAt < range.start) return false;
      if (range.end && completedAt > range.end) return false;
      return true;
    });
  }, [earnings, range]);

  const ongoingOrders = filteredOrders.filter(order => order.status !== "Completed" && order.status !== "Cancelled");
  const cancelledOrders = filteredOrders.filter(order => order.status === "Cancelled");

  const completedRevenue = filteredEarnings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  if (loading || !stats) {
    return <div>Loading...</div>;
  }

  const metrics = [
    {
      title: "Total Revenue",
      value: `₹${completedRevenue.toFixed(2)}`,
      color: "bg-blue-600",
    },
    {
      title: "Completed Orders",
      value: filteredEarnings.length.toString(),
      color: "bg-green-500",
    },
    {
      title: "Ongoing Orders",
      value: ongoingOrders.length.toString(),
      color: "bg-yellow-500",
    },
    {
      title: "Cancelled Orders",
      value: cancelledOrders.length.toString(),
      color: "bg-red-500",
    },
  ];

  const salesData = filteredEarnings.reduce((acc, item) => {
    const completedAt = item.completedAt instanceof Date ? item.completedAt : item.completedAt ? new Date(item.completedAt) : null;
    if (!completedAt) return acc;
    const date = completedAt.toLocaleDateString("en-GB");
    const existingEntry = acc.find(entry => entry.date === date);
    if (existingEntry) {
      existingEntry.sales += Number(item.amount) || 0;
    } else {
      acc.push({ date, sales: Number(item.amount) || 0 });
    }
    return acc;
  }, [] as { date: string; sales: number }[]);

  return (
    <div className="p-4 space-y-8 max-w-7xl mx-auto">
      {/* Overall Performance Section */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Overall Performance</h2>
            <p className="text-sm text-muted-foreground">A summary of your restaurant's overall performance.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
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
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index} className={`${metric.color} text-white`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm">{metric.title}</p>
                    <p className="text-3xl font-bold">{metric.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sales Details Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
