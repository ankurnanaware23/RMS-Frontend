import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { Table } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AddTableFormProps {
  onAddTable: (table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) => void;
  existingTables?: Table[];
}

export function AddTableForm({ onAddTable, existingTables = [] }: AddTableFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    number: '',
    seats: '',
  });
  const [numberError, setNumberError] = useState('');

  const existingNumbers = useMemo(
    () => new Set(existingTables.map(table => table.number)),
    [existingTables]
  );

  useEffect(() => {
    if (!formData.number) {
      setNumberError('');
      return;
    }

    const timeout = setTimeout(() => {
      const value = parseInt(formData.number, 10);
      if (Number.isNaN(value)) {
        setNumberError('Please enter a valid table number.');
        return;
      }
      if (existingNumbers.has(value)) {
        setNumberError(`Table number ${value} already present.`);
        return;
      }
      setNumberError('');
    }, 800);

    return () => clearTimeout(timeout);
  }, [formData.number, existingNumbers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.number || !formData.seats) {
      return;
    }

    const tableNumber = parseInt(formData.number, 10);
    if (Number.isNaN(tableNumber) || numberError) {
      return;
    }

    const tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt'> = {
      number: tableNumber,
      seats: parseInt(formData.seats, 10),
      status: 'Available',
    };

    onAddTable(tableData);
    setOpen(false);
    setFormData({
      number: '',
      seats: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-border">
          Add Table <PlusCircle className="h-4 w-4 mr-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Table</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="number" className="text-foreground">Table Number</Label>
            <Input
              id="number"
              type="number"
              placeholder="Enter table number"
              value={formData.number}
              onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
              className="bg-card border-border text-foreground"
              required
            />
            {numberError && (
              <p className="text-xs text-restaurant-red">{numberError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seats" className="text-foreground">Number of Seats</Label>
            <Input
              id="seats"
              type="number"
              placeholder="Enter number of seats"
              value={formData.seats}
              onChange={(e) => setFormData(prev => ({ ...prev, seats: e.target.value }))}
              className="bg-card border-border text-foreground"
              required
            />
          </div>

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
              className="bg-restaurant-blue hover:bg-restaurant-blue/90"
              disabled={Boolean(numberError)}
            >
              Add Table
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
