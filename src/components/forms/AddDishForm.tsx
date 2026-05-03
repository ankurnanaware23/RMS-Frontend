import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MenuItem, Category } from '@/types';

interface AddDishFormProps {
  onAddDish: (dish: Omit<MenuItem, 'id'>) => void;
  categories: Category[];
}

export function AddDishForm({ onAddDish, categories }: AddDishFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    categoryId: '',
    isVeg: 'true',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.categoryId) return;

    onAddDish({
      ...formData,
      price: parseFloat(formData.price),
      categoryId: parseInt(formData.categoryId),
      isVeg: formData.isVeg === 'true',
      category: '',
      available: true,
      preparationTime: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setOpen(false);
    setFormData({ name: '', price: '', description: '', categoryId: '', isVeg: 'true' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-border">
          Add Dish 🍽️
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Dish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Dish Name</Label>
            <Input
              id="name"
              placeholder="Enter dish name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-card border-border text-foreground"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price" className="text-foreground">Price</Label>
            <Input
              id="price"
              type="number"
              placeholder="Enter price"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="bg-card border-border text-foreground"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Input
              id="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-card border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category" className="text-foreground">Category</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))} value={formData.categoryId}>
                <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                ))}
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="veg" className="text-foreground">Type</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, isVeg: value }))} value={formData.isVeg}>
              <SelectTrigger className="bg-card border-border text-foreground">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="true">Veg</SelectItem>
                <SelectItem value="false">Non-Veg</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border">
              Cancel
            </Button>
            <Button type="submit" className="bg-restaurant-blue hover:bg-restaurant-blue/90">
              Add Dish
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
