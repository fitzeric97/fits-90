import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Plus, Globe, Edit3, Save, X, Tag, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { useScrapedPromotions } from "@/hooks/useScrapedPromotions";

interface BrandWebsite {
  id: string;
  brand_name: string;
  website_url: string;
  is_active: boolean;
  scraping_enabled: boolean;
  last_scraped_at?: string;
  created_at: string;
}

export default function Brands() {
  const [brandWebsites, setBrandWebsites] = useState<BrandWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBrand, setNewBrand] = useState({ name: "", url: "" });
  const [editBrand, setEditBrand] = useState({ name: "", url: "" });
  const [selectedBrandPromotions, setSelectedBrandPromotions] = useState<string | null>(null);
  const { user } = useAuth();
  const { scrapedPromotions, hasScrapedPromotions, getScrapedPromotionsForBrand } = useScrapedPromotions();

  useEffect(() => {
    fetchBrandWebsites();
  }, []);

  const fetchBrandWebsites = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('brand_websites')
        .select('*')
        .order('brand_name', { ascending: true });

      if (error) throw error;
      setBrandWebsites((data as BrandWebsite[]) || []);
    } catch (error) {
      console.error('Error fetching brand websites:', error);
      toast.error("Failed to load brand websites");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrand.name.trim() || !newBrand.url.trim()) {
      toast.error("Please enter both brand name and website URL");
      return;
    }

    // Validate URL format
    try {
      new URL(newBrand.url);
    } catch {
      toast.error("Please enter a valid website URL (e.g., https://example.com)");
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('brand_websites')
        .insert({
          brand_name: newBrand.name.trim(),
          website_url: newBrand.url.trim(),
          is_active: true,
          scraping_enabled: true
        });

      if (error) throw error;

      toast.success(`Added ${newBrand.name} for tracking`);
      setNewBrand({ name: "", url: "" });
      setIsAdding(false);
      await fetchBrandWebsites();
    } catch (error: any) {
      console.error('Error adding brand:', error);
      if (error.code === '23505') {
        toast.error("This brand already exists");
      } else {
        toast.error("Failed to add brand");
      }
    }
  };

  const handleEditBrand = async (id: string) => {
    if (!editBrand.name.trim() || !editBrand.url.trim()) {
      toast.error("Please enter both brand name and website URL");
      return;
    }

    try {
      new URL(editBrand.url);
    } catch {
      toast.error("Please enter a valid website URL");
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('brand_websites')
        .update({
          brand_name: editBrand.name.trim(),
          website_url: editBrand.url.trim()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success("Brand updated successfully");
      setEditingId(null);
      setEditBrand({ name: "", url: "" });
      await fetchBrandWebsites();
    } catch (error: any) {
      console.error('Error updating brand:', error);
      toast.error("Failed to update brand");
    }
  };

  const handleDeleteBrand = async (id: string, brandName: string) => {
    if (!confirm(`Are you sure you want to delete ${brandName}? This will also remove all scraped promotions for this brand.`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('brand_websites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(`Removed ${brandName} from tracking`);
      await fetchBrandWebsites();
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error("Failed to delete brand");
    }
  };

  const handleToggleScrapingEnabled = async (id: string, enabled: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('brand_websites')
        .update({ scraping_enabled: enabled })
        .eq('id', id);

      if (error) throw error;

      toast.success(enabled ? "Scraping enabled" : "Scraping disabled");
      await fetchBrandWebsites();
    } catch (error) {
      console.error('Error toggling scraping:', error);
      toast.error("Failed to update scraping status");
    }
  };

  const startEditing = (brand: BrandWebsite) => {
    setEditingId(brand.id);
    setEditBrand({ name: brand.brand_name, url: brand.website_url });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditBrand({ name: "", url: "" });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading brand websites...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Brands</h1>
            <p className="text-muted-foreground mt-2">
              Manage websites to scrape for promotions and deals
            </p>
          </div>
        </div>

        {/* Add New Brand Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Brand Website
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isAdding ? (
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Brand Website
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand-name">Brand Name</Label>
                    <Input
                      id="brand-name"
                      placeholder="e.g., Nike"
                      value={newBrand.name}
                      onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website-url">Website URL</Label>
                    <Input
                      id="website-url"
                      placeholder="https://www.nike.com"
                      value={newBrand.url}
                      onChange={(e) => setNewBrand({ ...newBrand, url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddBrand}>
                    <Save className="w-4 h-4 mr-2" />
                    Add Brand
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAdding(false);
                      setNewBrand({ name: "", url: "" });
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing Brand Websites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Tracked Brand Websites ({brandWebsites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {brandWebsites.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No brand websites added</h3>
                <p className="text-muted-foreground">
                  Add your first brand website to start tracking promotions
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {brandWebsites.map((brand) => (
                  <Card
                    key={brand.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      {editingId === brand.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            <Input
                              value={editBrand.name}
                              onChange={(e) => setEditBrand({ ...editBrand, name: e.target.value })}
                              placeholder="Brand name"
                            />
                            <Input
                              value={editBrand.url}
                              onChange={(e) => setEditBrand({ ...editBrand, url: e.target.value })}
                              placeholder="Website URL"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditBrand(brand.id)}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{brand.brand_name}</h3>
                                {brand.scraping_enabled ? (
                                  <Badge variant="default">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Disabled</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-1 break-all">
                                <Globe className="w-3 h-3 inline mr-1" />
                                {brand.website_url}
                              </p>
                              {brand.last_scraped_at && (
                                <p className="text-xs text-muted-foreground">
                                  Last scraped: {new Date(brand.last_scraped_at).toLocaleString()}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                              {/* Promotion Status Indicator */}
                              {hasScrapedPromotions(brand.brand_name) ? (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => setSelectedBrandPromotions(brand.brand_name)}
                                >
                                  <Tag className="w-4 h-4 mr-1" />
                                  Promotions Found
                                </Button>
                              ) : (
                                <div className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-md border text-center">
                                  No Promo Found
                                </div>
                              )}
                              
                              <div className="flex items-center justify-center gap-2 px-3 py-1 border rounded-md">
                                <Label htmlFor={`scraping-${brand.id}`} className="text-xs">
                                  Scraping
                                </Label>
                                <Switch
                                  id={`scraping-${brand.id}`}
                                  checked={brand.scraping_enabled}
                                  onCheckedChange={(checked) => 
                                    handleToggleScrapingEnabled(brand.id, checked)
                                  }
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditing(brand)}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteBrand(brand.id, brand.brand_name)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Promotions Dialog */}
        <Dialog open={selectedBrandPromotions !== null} onOpenChange={() => setSelectedBrandPromotions(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Scraped Promotions for {selectedBrandPromotions}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedBrandPromotions && getScrapedPromotionsForBrand(selectedBrandPromotions).map((promotion) => (
                <Card key={promotion.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg">{promotion.promotion_title}</h4>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                    {promotion.promotion_description && (
                      <p className="text-muted-foreground mb-3">{promotion.promotion_description}</p>
                    )}
                    {promotion.discount_code && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-green-800">Promo Code:</span>
                            <code className="px-3 py-2 bg-white border border-green-300 rounded font-mono text-lg font-bold text-green-900 select-all">
                              {promotion.discount_code}
                            </code>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(promotion.discount_code || "");
                              toast.success("Promo code copied to clipboard!");
                            }}
                            className="border-green-300 text-green-800 hover:bg-green-100"
                          >
                            Copy Code
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {promotion.discount_percentage && (
                        <div>
                          <span className="font-medium">Discount:</span> {promotion.discount_percentage}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Source:</span> {promotion.brand_website_url}
                      </div>
                      <div>
                        <span className="font-medium">Scraped:</span> {new Date(promotion.scraped_at).toLocaleString()}
                      </div>
                      {promotion.expires_at && (
                        <div>
                          <span className="font-medium">Expires:</span> {new Date(promotion.expires_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {promotion.promotion_url && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(promotion.promotion_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Promotion
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {selectedBrandPromotions && getScrapedPromotionsForBrand(selectedBrandPromotions).length === 0 && (
                <div className="text-center py-8">
                  <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No promotions found</h3>
                  <p className="text-muted-foreground">
                    No scraped promotions available for {selectedBrandPromotions}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
