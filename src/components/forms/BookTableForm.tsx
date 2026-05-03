import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Table } from '@/types';

interface BookTableFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBookTable: (tableId: string, customerName: string, reservationDateTime: string) => void;
  tables: Table[];
}

export function BookTableForm({ isOpen, onClose, onBookTable, tables }: BookTableFormProps) {
  const [tableId, setTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [reservationDate, setReservationDate] = useState<Date | undefined>(undefined);
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('AM');
  const [error, setError] = useState('');

  const sortedTables = useMemo(
    () => [...tables].sort((a, b) => a.number - b.number),
    [tables]
  );
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const hourOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')),
    []
  );
  const minuteOptions = useMemo(
    () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')),
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableId || !customerName || !reservationDate) {
      setError('Please fill all fields.');
      return;
    }

    const selected = new Date(reservationDate);
    const hourNumber = Number(hour) % 12;
    const hour24 = meridiem === 'PM' ? hourNumber + 12 : hourNumber;
    selected.setHours(hour24, Number(minute), 0, 0);

    if (selected.getTime() < Date.now()) {
      setError('Please select a future date and time.');
      return;
    }

    setError('');
    onBookTable(tableId, customerName, selected.toISOString());
    onClose();
    setTableId('');
    setCustomerName('');
    setReservationDate(undefined);
    setHour('12');
    setMinute('00');
    setMeridiem('AM');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a Table</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Select onValueChange={setTableId} value={tableId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {sortedTables.map(table => (
                  <SelectItem key={table.id} value={table.id}>
                    Table {table.number} ({table.seats} seats)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <div className="de-datepicker w-full">
              <Tabs defaultValue="date">
                <TabsList className="w-full grid grid-cols-2 bg-muted/30">
                  <TabsTrigger value="date">Date</TabsTrigger>
                  <TabsTrigger value="time">Time</TabsTrigger>
                </TabsList>
                <TabsContent value="date" className="mt-3">
                  <div className="rounded-md border border-border bg-card p-2 flex justify-center">
                    <Calendar
                      mode="single"
                      selected={reservationDate}
                      onSelect={setReservationDate}
                      disabled={{ before: today }}
                      initialFocus
                    />
                  </div>
                </TabsContent>
                <TabsContent value="time" className="mt-3">
                  <div className="rounded-md border border-border bg-card p-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Hour</div>
                        <Select value={hour} onValueChange={setHour}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {hourOptions.map(value => (
                              <SelectItem key={value} value={value}>{value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Minute</div>
                        <Select value={minute} onValueChange={setMinute}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {minuteOptions.map(value => (
                              <SelectItem key={value} value={value}>{value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">AM/PM</div>
                        <Select value={meridiem} onValueChange={(value) => setMeridiem(value as 'AM' | 'PM')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Selected: {hour}:{minute} {meridiem}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            {error && (
              <p className="text-xs text-restaurant-red">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">Book Table</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
