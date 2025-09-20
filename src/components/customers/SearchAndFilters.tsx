import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter,
  X
} from 'lucide-react';

interface SearchAndFiltersProps {
  onSearch: (query: string) => void;
  onFilter: (filters: Record<string, any>) => void;
}

export function SearchAndFilters({ onSearch, onFilter }: SearchAndFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleApplyFilters = () => {
    onFilter(filters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    onFilter({});
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filters</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                placeholder="Has email"
                type="checkbox"
                checked={filters.hasEmail || false}
                onChange={(e) => updateFilter('hasEmail', e.target.checked)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                placeholder="Has phone"
                type="checkbox"
                checked={filters.hasPhone || false}
                onChange={(e) => updateFilter('hasPhone', e.target.checked)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Created After</label>
              <Input
                type="date"
                value={filters.createdAfter || ''}
                onChange={(e) => updateFilter('createdAfter', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClearFilters}>
              Clear
            </Button>
            <Button onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}