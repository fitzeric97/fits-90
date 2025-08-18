import { useState } from 'react';
import { useStyleInspirations, useInspirationInteraction } from '@/hooks/useStyleInspirations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Bookmark, Eye, ExternalLink, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface StyleInspirationsGridProps {
  category?: string;
  season?: string;
  limit?: number;
}

export function StyleInspirationsGrid({ 
  category, 
  season, 
  limit 
}: StyleInspirationsGridProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFilters, setSelectedFilters] = useState({
    category: category || '',
    season: season || ''
  });

  const { data: inspirations, isLoading } = useStyleInspirations({
    ...selectedFilters,
    limit
  });

  const interactionMutation = useInspirationInteraction();

  const categories = ['streetwear', 'formal', 'casual', 'minimalist', 'vintage', 'bohemian'];
  const seasons = ['spring', 'summer', 'fall', 'winter', 'all-season'];

  const handleInteraction = async (inspirationId: string, type: 'like' | 'save') => {
    try {
      const result = await interactionMutation.mutateAsync({
        inspirationId,
        interactionType: type
      });

      toast({
        description: `${type === 'like' ? 'Like' : 'Save'} ${result.action}!`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Please log in to interact with inspirations'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-[4/5] bg-muted rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded mb-4 w-2/3"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-muted rounded w-16"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Category</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFilters.category === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilters(prev => ({ ...prev, category: '' }))}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedFilters.category === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilters(prev => ({ ...prev, category: cat }))}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Season</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFilters.season === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilters(prev => ({ ...prev, season: '' }))}
            >
              All
            </Button>
            {seasons.map(s => (
              <Button
                key={s}
                variant={selectedFilters.season === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilters(prev => ({ ...prev, season: s }))}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inspirations?.map((inspiration) => (
          <Card 
            key={inspiration.id} 
            className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/inspirations/${inspiration.id}`)}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src={inspiration.image_url}
                alt={inspiration.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                {inspiration.products && inspiration.products.length > 0 && (
                  <Badge variant="secondary" className="bg-white/90 text-black">
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    {inspiration.products.length} products
                  </Badge>
                )}
              </div>

              {/* Quick action buttons */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInteraction(inspiration.id, 'like');
                  }}
                >
                  <Heart 
                    className={cn(
                      "h-4 w-4",
                      inspiration.user_liked ? "fill-red-500 text-red-500" : "text-muted-foreground"
                    )}
                  />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInteraction(inspiration.id, 'save');
                  }}
                >
                  <Bookmark 
                    className={cn(
                      "h-4 w-4",
                      inspiration.user_saved ? "fill-blue-500 text-blue-500" : "text-muted-foreground"
                    )}
                  />
                </Button>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold line-clamp-1">{inspiration.title}</h3>
                {inspiration.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {inspiration.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {inspiration.category && (
                    <Badge variant="outline" className="text-xs">
                      {inspiration.category}
                    </Badge>
                  )}
                  {inspiration.season && (
                    <Badge variant="outline" className="text-xs">
                      {inspiration.season}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {inspiration.like_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark className="h-3 w-3" />
                      {inspiration.save_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {inspiration.view_count}
                    </span>
                  </div>

                  {inspiration.source_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(inspiration.source_url, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {inspirations?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No inspirations found for the selected filters.</p>
        </div>
      )}
    </div>
  );
}