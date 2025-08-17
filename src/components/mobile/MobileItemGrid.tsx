import { useState } from "react";
import { Grid3x3, List, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MobileItemGridProps {
  items: any[];
  renderItem: (item: any, viewMode: 'grid' | 'list') => React.ReactNode;
  onAddNew?: () => void;
  addButtonText?: string;
  emptyMessage?: string;
  extraControls?: React.ReactNode;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export function MobileItemGrid({ 
  items, 
  renderItem, 
  onAddNew,
  addButtonText = "Add Item",
  emptyMessage = "No items yet",
  extraControls,
  onSearch,
  searchPlaceholder = "Search items..."
}: MobileItemGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="sticky top-0 bg-primary z-30 p-4 border-b border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-primary-foreground">{items.length} items</h2>
            {extraControls}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-primary-foreground/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded text-primary-foreground",
                  viewMode === 'grid' && "bg-primary-foreground/30 shadow-sm"
                )}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded text-primary-foreground",
                  viewMode === 'list' && "bg-primary-foreground/30 shadow-sm"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            {onAddNew && (
              <Button size="sm" onClick={onAddNew} variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Search Bar - Centered */}
        {items.length > 0 && onSearch && (
          <div className="flex justify-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-foreground/60" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground mb-4">{emptyMessage}</p>
            {onAddNew && (
              <Button onClick={onAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                {addButtonText}
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-2 gap-3"
              : "space-y-3"
          )}>
            {items.map(item => renderItem(item, viewMode))}
          </div>
        )}
      </div>
    </div>
  );
}