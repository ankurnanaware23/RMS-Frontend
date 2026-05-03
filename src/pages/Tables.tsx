import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { AddTableForm } from '@/components/forms/AddTableForm';
import { BookTableForm } from '@/components/forms/BookTableForm';
import { Table } from '@/types';

export default function Tables() {
  const navigate = useNavigate();
  const { tables, addTable, updateTable, deleteTable, bookTable } = useRestaurantData();
  const [activeFilter, setActiveFilter] = useState("All");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const tableStatuses = [
    { label: "All", active: activeFilter === "All" },
    { label: "Available", active: activeFilter === "Available" },
    { label: "Booked", active: activeFilter === "Booked" },
    { label: "Occupied", active: activeFilter === "Occupied" },
  ];

  const filteredTables = tables.filter(table => 
    activeFilter === "All" || table.status === activeFilter
  );
  const sortedTables = [...filteredTables].sort((a, b) => a.number - b.number);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-restaurant-green';
      case 'Booked':
        return 'bg-restaurant-orange';
      case 'Occupied':
        return 'bg-restaurant-red';
      default:
        return 'bg-muted';
    }
  };

  const getCustomerBgColor = (index: number) => {
    const colors = ['bg-restaurant-blue', 'bg-restaurant-green', 'bg-restaurant-brown', 'bg-restaurant-purple'];
    return colors[index % colors.length];
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return parts.map(part => part[0]).join('').toUpperCase();
  };

  const handleStatusChange = (tableId: string, newStatus: Table['status']) => {
    updateTable(tableId, { 
      status: newStatus,
      customer: newStatus === 'Booked' ? tables.find(t => t.id === tableId)?.customer : undefined,
      reservationTime: newStatus === 'Booked' ? tables.find(t => t.id === tableId)?.reservationTime : undefined,
    });
  };

  const handleOccupy = (tableId: string) => {
    updateTable(tableId, {
      status: 'Occupied',
      customer: undefined,
      reservationTime: undefined,
    });
  };

  const handleFree = (tableId: string) => {
    updateTable(tableId, {
      status: 'Available',
      customer: undefined,
      reservationTime: undefined,
    });
  };

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
          <h1 className="text-2xl font-bold text-foreground">Tables</h1>
        </div>

        <div className="flex gap-2">
          {tableStatuses.map((status) => (
            <Button
              key={status.label}
              variant={status.active ? "default" : "outline"}
              size="sm"
              className={status.active ? "bg-muted text-foreground" : "border-border"}
              onClick={() => setActiveFilter(status.label)}
            >
              {status.label} {status.label === "All" ? `(${tables.length})` : `(${tables.filter(t => t.status === status.label).length})`}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <AddTableForm onAddTable={addTable} existingTables={tables} />
        <Button onClick={() => setIsBookingModalOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Book Table
        </Button>
      </div>

      <BookTableForm 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBookTable={bookTable}
        tables={[...tables.filter(t => t.status === 'Available')].sort((a, b) => a.number - b.number)}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {sortedTables.map((table, index) => (
          <Card key={table.id} className="bg-card border-border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-foreground">Table - {table.number}</div>
                <Badge 
                  className={`${getStatusColor(table.status)} text-white`}
                >
                  {table.status}
                </Badge>
              </div>

              <div className="flex justify-center mb-4">
                {table.status === 'Booked' && table.customer ? (
                  <div className={`w-16 h-16 ${getCustomerBgColor(index)} rounded-full flex items-center justify-center text-white font-semibold text-lg`}>
                    {getInitials(table.customer)}
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-semibold">
                    N/A
                  </div>
                )}
              </div>

              <div className="text-center space-y-1">
                <div>
                  <span className="text-sm text-muted-foreground">Seats: </span>
                  <span className="text-sm font-medium text-foreground">{table.seats}</span>
                </div>
                {table.status === 'Booked' && table.customer && (
                  <div>
                    <span className="text-sm text-muted-foreground">Booked by: </span>
                    <span className="text-sm font-medium text-foreground">{table.customer}</span>
                  </div>
                )}
                {table.status === 'Booked' && table.reservationTime && (
                  <div>
                    <span className="text-sm text-muted-foreground">Time: </span>
                    <span className="text-sm font-medium text-foreground">{table.reservationTime}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                {table.status === 'Available' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleOccupy(table.id)}
                  >
                    Occupy
                  </Button>
                )}
                {table.status !== 'Available' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleFree(table.id)}
                  >
                    Free
                  </Button>
                )}
                {table.status === 'Booked' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleOccupy(table.id)}
                  >
                    Occupy
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTable(table.id)}
                  className="text-restaurant-red hover:text-restaurant-red"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No tables found for the selected filter.</p>
        </div>
      )}
    </div>
  );
}
