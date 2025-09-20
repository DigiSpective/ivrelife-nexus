import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onValueChange: (value: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ 
  value, 
  onValueChange, 
  onFilterClick,
  placeholder = "Search...", 
  className = "" 
}: SearchBarProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="pl-10"
        />
      </div>
      {onFilterClick && (
        <Button variant="outline" onClick={onFilterClick}>
          <Filter className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}