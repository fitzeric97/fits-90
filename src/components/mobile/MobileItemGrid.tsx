import { useState } from "react";
import { Grid3x3, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileItemGridProps {
  items: any[];
  renderItem: (item: any, viewMode: 'grid' | 'list') => React.ReactNode;
  onAddNew?: () => void;
  addButtonText?: string;
  emptyMessage?: string;
  extraControls?: React.ReactNode;
}

export function MobileItemGrid({ 
  items, 
  renderItem, 
  onAddNew,
  addButtonText = "Add Item",
  emptyMessage = "No items yet",
  extraControls
}: MobileItemGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="sticky top-0 bg-background z-30 p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{items.length} items</h2>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded",
                  viewMode === 'grid' && "bg-background shadow-sm"
                )}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded",
                  viewMode === 'list' && "bg-background shadow-sm"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            {onAddNew && (
              <Button size="sm" onClick={onAddNew}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {extraControls && (
          <div className="flex justify-start">
            {extraControls}
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