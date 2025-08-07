import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Tag, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PromotionalEmail {
  id: string;
  subject: string;
  snippet: string | null;
  received_date: string;
  expires_at: string | null;
  is_expired: boolean;
  body_html: string | null;
  order_total: string | null;
  sender_name: string | null;
}

export default function BrandPromotions() {
  const { brandName } = useParams<{ brandName: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<PromotionalEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (brandName) {
      fetchBrandPromotions();
    }
  }, [brandName]);

  const fetchBrandPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotional_emails')
        .select('*')
        .eq('brand_name', decodeURIComponent(brandName || ''))
        .order('received_date', { ascending: false });

      if (error) throw error;

      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching brand promotions:', error);
      toast({
        title: "Error",
        description: "Failed to load promotions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (expiresAt: string | null, isExpired: boolean) => {
    if (isExpired) return true;
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading promotions...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{decodeURIComponent(brandName || '')} Promotions</h1>
            <p className="text-muted-foreground">
              {promotions.length} promotion{promotions.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Promotions Grid */}
        {promotions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Promotions Found</h3>
              <p className="text-muted-foreground text-center">
                We don't have any promotions for {decodeURIComponent(brandName || '')} yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {promotions.map((promotion) => {
              const expired = isExpired(promotion.expires_at, promotion.is_expired);
              
              return (
                <Card key={promotion.id} className={expired ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {promotion.subject}
                        </CardTitle>
                        {promotion.snippet && (
                          <CardDescription className="line-clamp-2">
                            {promotion.snippet}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {expired && (
                          <Badge variant="secondary">Expired</Badge>
                        )}
                        {!expired && (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Received {formatDate(promotion.received_date)}
                        </div>
                        {promotion.expires_at && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-4 w-4" />
                            Expires {formatDate(promotion.expires_at)}
                          </div>
                        )}
                        {promotion.sender_name && (
                          <div>From: {promotion.sender_name}</div>
                        )}
                        {promotion.order_total && (
                          <div className="font-medium">Value: {promotion.order_total}</div>
                        )}
                      </div>
                      {promotion.body_html && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Open email content in a new window/modal
                            const newWindow = window.open('', '_blank');
                            if (newWindow) {
                              newWindow.document.write(promotion.body_html || '');
                              newWindow.document.title = promotion.subject;
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}