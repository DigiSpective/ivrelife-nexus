import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SortingProps {
  sortBy: 'price-asc' | 'price-desc' | 'newest' | 'popular';
  onSortChange: (value: 'price-asc' | 'price-desc' | 'newest' | 'popular') => void;
}

export const Sorting: React.FC<SortingProps> = ({ sortBy, onSortChange }) => {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="sort">Sort by:</Label>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger id="sort" className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest Arrivals</SelectItem>
          <SelectItem value="popular">Most Popular</SelectItem>
          <SelectItem value="price-asc">Price: Low to High</SelectItem>
          <SelectItem value="price-desc">Price: High to Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};