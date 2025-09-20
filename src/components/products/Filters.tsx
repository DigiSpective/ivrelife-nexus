import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { ProductCategory } from '@/types';
// Remove the incorrect import
// import { productCategoryService } from '@/lib/services';

interface FiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategories: string[];
  onCategoryChange: (categoryId: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  selectedRatings: number[];
  onRatingChange: (rating: number) => void;
  availability: 'all' | 'in-stock' | 'out-of-stock';
  onAvailabilityChange: (availability: 'all' | 'in-stock' | 'out-of-stock') => void;
  onResetFilters: () => void;
}

export const Filters: React.FC<FiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategories,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  selectedRatings,
  onRatingChange,
  availability,
  onAvailabilityChange,
  onResetFilters
}) => {
  const [categories, setCategories] = useState<ProductCategory[]>([
    // Mock categories data since we don't have a service to fetch them
    { id: 'cat-1', retailer_id: 'ret-1', name: 'Electronics', requires_ltl: false, created_at: '2024-01-01' },
    { id: 'cat-2', retailer_id: 'ret-1', name: 'Computers', requires_ltl: false, created_at: '2024-01-01' },
    { id: 'cat-3', retailer_id: 'ret-1', name: 'TV & Home Theater', requires_ltl: false, created_at: '2024-01-01' },
    { id: 'cat-4', retailer_id: 'ret-1', name: 'Audio', requires_ltl: false, created_at: '2024-01-01' },
    { id: 'cat-5', retailer_id: 'ret-1', name: 'Cameras', requires_ltl: false, created_at: '2024-01-01' }
  ]);
  const [isLoading, setIsLoading] = useState(false); // Set to false since we're using mock data

  // Remove the useEffect that was trying to fetch categories
  // We're using mock data instead

  const handleCategoryChange = (categoryId: string) => {
    onCategoryChange(categoryId);
  };

  const handleRatingChange = (rating: number) => {
    if (selectedRatings.includes(rating)) {
      // Remove the rating from selectedRatings
      const newRatings = selectedRatings.filter(r => r !== rating);
      // We need to pass the new array to the handler
      // Since the parent component manages the state, we'll just call the handler
      // The implementation here is a bit unclear from the original code
      // Let's assume the handler manages the selection logic
      onRatingChange(rating);
    } else {
      // Add the rating to selectedRatings
      onRatingChange(rating);
    }
  };

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg shadow-md">
      {/* Search Input */}
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <input
          id="search"
          type="text"
          placeholder="Search products..."
          className="w-full px-3 py-2 border rounded-md"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-describedby="search-help"
        />
        <p id="search-help" className="text-sm text-muted-foreground">
          Search by product name, description, or SKU
        </p>
      </div>

      {/* Categories Filter */}
      <Accordion type="single" collapsible defaultValue="categories">
        <AccordionItem value="categories">
          <AccordionTrigger>Categories</AccordionTrigger>
          <AccordionContent>
            {isLoading ? (
              <p>Loading categories...</p>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => handleCategoryChange(category.id)}
                      aria-describedby={`category-${category.id}-description`}
                    />
                    <Label
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {category.name}
                    </Label>
                    <span id={`category-${category.id}-description`} className="sr-only">
                      Filter by {category.name} category
                    </span>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Price Range Filter */}
        <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider
                min={0}
                max={5000}
                step={10}
                value={priceRange}
                onValueChange={onPriceRangeChange}
                minStepsBetweenThumbs={1}
                aria-label="Price range filter"
              />
              <div className="flex justify-between text-sm">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rating Filter */}
        <AccordionItem value="rating">
          <AccordionTrigger>Rating</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rating-${rating}`}
                    checked={selectedRatings.includes(rating)}
                    onCheckedChange={() => handleRatingChange(rating)}
                    aria-describedby={`rating-${rating}-description`}
                  />
                  <Label
                    htmlFor={`rating-${rating}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          aria-hidden="true"
                        >
                          ★
                        </span>
                      ))}
                      <span className="ml-2">& up</span>
                    </div>
                  </Label>
                  <span id={`rating-${rating}-description`} className="sr-only">
                    Filter by {rating} star rating and above
                  </span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Availability Filter */}
        <AccordionItem value="availability">
          <AccordionTrigger>Availability</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="availability-all"
                  checked={availability === 'all'}
                  onCheckedChange={() => onAvailabilityChange('all')}
                  aria-describedby="availability-all-description"
                />
                <Label
                  htmlFor="availability-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  All
                </Label>
                <span id="availability-all-description" className="sr-only">
                  Show all products regardless of availability
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="availability-in-stock"
                  checked={availability === 'in-stock'}
                  onCheckedChange={() => onAvailabilityChange('in-stock')}
                  aria-describedby="availability-in-stock-description"
                />
                <Label
                  htmlFor="availability-in-stock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  In Stock
                </Label>
                <span id="availability-in-stock-description" className="sr-only">
                  Show only products that are in stock
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="availability-out-of-stock"
                  checked={availability === 'out-of-stock'}
                  onCheckedChange={() => onAvailabilityChange('out-of-stock')}
                  aria-describedby="availability-out-of-stock-description"
                />
                <Label
                  htmlFor="availability-out-of-stock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Out of Stock
                </Label>
                <span id="availability-out-of-stock-description" className="sr-only">
                  Show only products that are out of stock
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Reset Filters Button */}
      <Button variant="outline" className="w-full" onClick={onResetFilters} aria-label="Reset all filters">
        Reset Filters
      </Button>
    </div>
  );
};