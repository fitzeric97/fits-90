import { useParams, useNavigate } from 'react-router-dom';
import { useStyleInspiration, useInspirationInteraction } from '@/hooks/useStyleInspirations';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Bookmark, 
  Eye, 
  ExternalLink, 
  ArrowLeft, 
  ShoppingBag,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function StyleInspirationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: inspiration, isLoading } = useStyleInspiration(id!);
  const interactionMutation = useInspirationInteraction();

  const handleInteraction = async (type: 'like' | 'save' | 'share') => {
    if (!id) return;

    if (type === 'share') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: inspiration?.title,
            text: inspiration?.description,
            url: window.location.href,
          });
        } catch (error) {
          // User cancelled or error occurred
        }
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          description: 'Link copied to clipboard!'
        });
      }
      return;
    }

    try {
      const result = await interactionMutation.mutateAsync({
        inspirationId: id,
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
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="aspect-[16/9] bg-muted rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!inspiration) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Inspiration Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The inspiration you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/inspirations')}>
              Back to Inspirations
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/inspirations')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inspirations
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Image */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
              <img
                src={inspiration.image_url}
                alt={inspiration.title}
                className="w-full h-full object-cover"
              />
              
              {/* Product hotspots */}
              {inspiration.products?.map((product) => (
                product.position_x && product.position_y && (
                  <button
                    key={product.id}
                    className="absolute w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                    style={{
                      left: `${product.position_x}%`,
                      top: `${product.position_y}%`
                    }}
                    onClick={() => window.open(product.product_url, '_blank')}
                  >
                    <ShoppingBag className="h-3 w-3 text-black" />
                  </button>
                )
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={inspiration.user_liked ? 'default' : 'outline'}
                  onClick={() => handleInteraction('like')}
                  className="flex items-center gap-2"
                >
                  <Heart 
                    className={cn(
                      "h-4 w-4",
                      inspiration.user_liked && "fill-current"
                    )}
                  />
                  {inspiration.like_count || 0}
                </Button>

                <Button
                  variant={inspiration.user_saved ? 'default' : 'outline'}
                  onClick={() => handleInteraction('save')}
                  className="flex items-center gap-2"
                >
                  <Bookmark 
                    className={cn(
                      "h-4 w-4",
                      inspiration.user_saved && "fill-current"
                    )}
                  />
                  {inspiration.save_count || 0}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleInteraction('share')}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                {inspiration.view_count} views
              </div>
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="space-y-6">
            {/* Title and Description */}
            <div>
              <h1 className="text-2xl font-bold mb-2">{inspiration.title}</h1>
              {inspiration.description && (
                <p className="text-muted-foreground">{inspiration.description}</p>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {inspiration.category && (
                <Badge variant="secondary">{inspiration.category}</Badge>
              )}
              {inspiration.season && (
                <Badge variant="outline">{inspiration.season}</Badge>
              )}
              {inspiration.tags?.map((tag, index) => (
                <Badge key={index} variant="outline">#{tag}</Badge>
              ))}
            </div>

            {/* Source Link */}
            {inspiration.source_url && (
              <Button
                variant="outline"
                onClick={() => window.open(inspiration.source_url, '_blank')}
                className="w-full flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Original Source
              </Button>
            )}

            {/* Products */}
            {inspiration.products && inspiration.products.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Shop the Look ({inspiration.products.length})
                </h3>
                <div className="space-y-3">
                  {inspiration.products.map((product) => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.product_name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1">
                              {product.product_name}
                            </h4>
                            {product.brand && (
                              <p className="text-xs text-muted-foreground">
                                {product.brand}
                              </p>
                            )}
                            {product.price && (
                              <p className="text-sm font-semibold">
                                {product.price}
                              </p>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 h-7 text-xs"
                              onClick={() => window.open(product.product_url, '_blank')}
                            >
                              Shop Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Meta Info */}
            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>Posted {formatDistanceToNow(new Date(inspiration.created_at))} ago</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}