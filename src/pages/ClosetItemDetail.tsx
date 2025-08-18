import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Calendar, Package, Palette, Ruler, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FallbackImage } from "@/components/ui/fallback-image";
import { EditClosetItemDialog } from "@/components/closet/EditClosetItemDialog";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClosetItem {
  id: string;
  brand_name: string;
  product_name: string | null;
  product_description: string | null;
  product_image_url: string | null;
  uploaded_image_url: string | null;
  stored_image_path: string | null;
  company_website_url: string | null;
  purchase_date: string | null;
  order_number: string | null;
  price: string | null;
  size: string | null;
  color: string | null;
  category: string | null;
  created_at: string;
}

export default function ClosetItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [item, setItem] = useState<ClosetItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchItem();
    }
  }, [id, user]);

  const fetchItem = async () => {
    try {
      const { data, error } = await supabase
        .from('closet_items')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Item not found",
            description: "This item doesn't exist or you don't have access to it.",
            variant: "destructive",
          });
          navigate('/closet');
          return;
        }
        throw error;
      }

      setItem(data);
    } catch (error) {
      console.error('Error fetching item:', error);
      toast({
        title: "Error",
        description: "Failed to load item details.",
        variant: "destructive",
      });
      navigate('/closet');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    
    if (!confirm(`Are you sure you want to delete "${item.product_name || item.brand_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('closet_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Item deleted",
        description: "The item has been removed from your closet.",
      });
      navigate('/closet');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading item...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!item) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Item not found</h2>
          <p className="text-muted-foreground mb-4">The item you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/closet')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Closet
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/closet')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Closet
          </Button>
          
          <div className="flex items-center gap-2">
            <EditClosetItemDialog
              item={item}
              onItemUpdated={fetchItem}
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Image + Button */}
          <div className="space-y-4">
            {/* Image */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square">
                  <FallbackImage
                    src={item.stored_image_path 
                      ? `https://ijawvesjgyddyiymiahk.supabase.co/storage/v1/object/public/closet-items/${item.stored_image_path}` 
                      : item.product_image_url
                    }
                    fallbackSrc={item.uploaded_image_url}
                    alt={item.product_name || item.brand_name}
                    className="w-full h-full object-cover"
                    fallbackIcon={<Package className="h-16 w-16 text-muted-foreground" />}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Brand Website Button */}
            {item.company_website_url && (
              <Button
                variant="outline"
                onClick={() => window.open(item.company_website_url!, '_blank')}
                className="w-full text-cream-text"
              >
                View on Brand Website
              </Button>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {item.product_name || "Untitled Item"}
                    </CardTitle>
                    <p className="text-lg text-muted-foreground mt-1">
                      {item.brand_name}
                    </p>
                  </div>
                  {item.price && (
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {item.price}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {item.product_description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">{item.product_description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {item.category && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Category:</span> {item.category}
                      </span>
                    </div>
                  )}
                  
                  {item.size && (
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Size:</span> {item.size}
                      </span>
                    </div>
                  )}
                  
                  {item.color && (
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Color:</span> {item.color}
                      </span>
                    </div>
                  )}
                  
                  {item.purchase_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Purchased:</span>{" "}
                        {new Date(item.purchase_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                 {item.order_number && (
                   <div>
                     <h4 className="font-medium mb-2">Order Number</h4>
                     <p className="text-sm text-muted-foreground font-mono">
                       {item.order_number}
                     </p>
                   </div>
                 )}

                 <div className="pt-4 border-t">
                   <p className="text-xs text-muted-foreground">
                     Added on {new Date(item.created_at).toLocaleDateString()}
                   </p>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}