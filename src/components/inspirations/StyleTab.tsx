import React, { useState } from 'react';
import { useStyleInspirations, useInspirationInteraction, useStyleInspiration } from '@/hooks/useStyleInspirations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Bookmark, ExternalLink, ShoppingBag, Sparkles, Filter, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StyleTabProps {
  className?: string;
}

export function StyleTab({ className }: StyleTabProps) {
  const { toast } = useToast();
  const [selectedInspiration, setSelectedInspiration] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    season: ''
  });

  const { data: inspirations, isLoading } = useStyleInspirations(filters);
  const { data: selectedInspirationData } = useStyleInspiration(selectedInspiration || '');
  const interactionMutation = useInspirationInteraction();

  const handleInteraction = async (inspirationId: string, type: 'like' | 'save', e?: React.MouseEvent) => {
    e?.stopPropagation();
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

  const InspirationCard = ({ inspiration }: { inspiration: any }) => (
    <Card 
      className="group overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
      onClick={() => setSelectedInspiration(inspiration.id)}
    >
      <div className="relative">
        <img 
          src={inspiration.image_url} 
          alt={inspiration.title}
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center">
          <Sparkles className="w-3 h-3 mr-1" />
          Style Inspiration
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{inspiration.title}</h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{inspiration.description}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {inspiration.tags?.map((tag: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center space-x-3">
            <button 
              onClick={(e) => handleInteraction(inspiration.id, 'like', e)}
              className={cn(
                "flex items-center space-x-1 transition-colors",
                inspiration.user_liked ? 'text-red-500' : 'hover:text-red-500'
              )}
            >
              <Heart className={cn("w-5 h-5", inspiration.user_liked ? 'fill-current' : '')} />
              <span className="text-sm">{inspiration.like_count || 0}</span>
            </button>
            <button 
              onClick={(e) => handleInteraction(inspiration.id, 'save', e)}
              className={cn(
                "flex items-center space-x-1 transition-colors",
                inspiration.user_saved ? 'text-blue-500' : 'hover:text-blue-500'
              )}
            >
              <Bookmark className={cn("w-5 h-5", inspiration.user_saved ? 'fill-current' : '')} />
              <span className="text-sm">{inspiration.save_count || 0}</span>
            </button>
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{inspiration.view_count || 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const DetailModal = () => {
    if (!selectedInspiration || !selectedInspirationData) return null;

    const inspiration = selectedInspirationData;

    return (
      <Dialog open={!!selectedInspiration} onOpenChange={() => setSelectedInspiration(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{inspiration.title}</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <img 
                src={inspiration.image_url} 
                alt={inspiration.title}
                className="w-full rounded-lg"
              />
              <div className="flex items-center justify-around mt-4 p-4 bg-muted rounded-lg">
                <button 
                  onClick={() => handleInteraction(inspiration.id, 'like')}
                  className={cn(
                    "flex items-center space-x-2 transition-colors",
                    inspiration.user_liked ? 'text-red-500' : 'hover:text-red-500'
                  )}
                >
                  <Heart className={cn("w-6 h-6", inspiration.user_liked ? 'fill-current' : '')} />
                  <span>{inspiration.like_count || 0} Likes</span>
                </button>
                <button 
                  onClick={() => handleInteraction(inspiration.id, 'save')}
                  className={cn(
                    "flex items-center space-x-2 transition-colors",
                    inspiration.user_saved ? 'text-blue-500' : 'hover:text-blue-500'
                  )}
                >
                  <Bookmark className={cn("w-6 h-6", inspiration.user_saved ? 'fill-current' : '')} />
                  <span>{inspiration.save_count || 0} Saves</span>
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-muted-foreground mb-4">{inspiration.description}</p>
              
              <div className="mb-4 flex gap-2">
                {inspiration.category && (
                  <Badge variant="outline">{inspiration.category}</Badge>
                )}
                {inspiration.season && (
                  <Badge variant="outline">{inspiration.season}</Badge>
                )}
              </div>
              
              {inspiration.products && inspiration.products.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Shop This Look
                  </h3>
                  <div className="space-y-3">
                    {inspiration.products.map((product: any) => (
                      <a
                        key={product.id}
                        href={product.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{product.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.brand} • {product.product_type}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {product.price && (
                              <span className="font-semibold mr-2">${product.price}</span>
                            )}
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {inspiration.tags && inspiration.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {inspiration.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className={cn("min-h-screen bg-background py-8", className)}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Sparkles className="w-8 h-8 mr-2 text-primary" />
            Style Inspiration
          </h1>
          <p className="text-muted-foreground">Curated looks to inspire your next outfit</p>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Select 
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="streetwear">Streetwear</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="athletic">Athletic</SelectItem>
                <SelectItem value="party">Party</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.season}
              onValueChange={(value) => setFilters({ ...filters, season: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Seasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Seasons</SelectItem>
                <SelectItem value="spring">Spring</SelectItem>
                <SelectItem value="summer">Summer</SelectItem>
                <SelectItem value="fall">Fall</SelectItem>
                <SelectItem value="winter">Winter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="w-full h-64" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 mb-2" />
                  <Skeleton className="h-3 mb-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {inspirations?.map((inspiration) => (
              <InspirationCard key={inspiration.id} inspiration={inspiration} />
            ))}
          </div>
        )}

        {!isLoading && (!inspirations || inspirations.length === 0) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No style inspirations found for the selected filters.</p>
          </div>
        )}

        {/* Detail Modal */}
        <DetailModal />
      </div>
    </div>
  );
}