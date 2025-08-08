import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MoreHorizontal, Eye, Trash2, CheckSquare, Square, ChevronLeft, ChevronRight, Globe, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { GmailConnector } from "@/components/gmail/GmailConnector";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useScrapedPromotions } from "@/hooks/useScrapedPromotions";
import { toast } from "sonner";

interface Promotion {
  id: string;
  brand_name: string;
  subject: string;
  expires_at: string | null;
  is_expired: boolean;
  received_date: string;
  sender_name: string;
  snippet: string;
  email_category: 'promotion' | 'order_confirmation' | 'shipping' | 'other';
  email_source: 'promotional' | 'inbox' | 'sent' | 'other';
  order_number?: string | null;
  order_total?: string | null;
  order_items?: string | null;
}

export function PromotionsTable() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showExpanded, setShowExpanded] = useState(false);
  const { user } = useAuth();
  const { toast: toastUi } = useToast();
  const { scrapedPromotions, loading: scrapedLoading, triggerManualScrape } = useScrapedPromotions();

  useEffect(() => {
    if (user) {
      fetchPromotions();
    }
  }, [user]);

  const fetchPromotions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('promotional_emails')
        .select('*')
        .eq('user_id', user.id)
        .order('received_date', { ascending: false });

      if (error) {
        console.error('Error fetching promotions:', error);
        return;
      }

      setPromotions((data || []) as Promotion[]);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualScrape = async () => {
    try {
      toast.info("Starting manual scrape...");
      const result = await triggerManualScrape();
      toast.success(`Scraping completed! Found ${result.promotionsFound} promotions from ${result.brandsScraped} brands.`);
    } catch (error) {
      toast.error("Failed to trigger manual scrape");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(currentPromotions.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('promotional_emails')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) {
        throw error;
      }

      toastUi({
        title: "Success",
        description: `Deleted ${selectedIds.size} promotional email${selectedIds.size === 1 ? '' : 's'}`,
      });

      setSelectedIds(new Set());
      await fetchPromotions();
    } catch (error: any) {
      console.error('Error deleting promotions:', error);
      toastUi({
        title: "Error",
        description: error.message || "Failed to delete promotional emails",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promotional_emails')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toastUi({
        title: "Success",
        description: "Promotional email deleted",
      });

      await fetchPromotions();
    } catch (error: any) {
      console.error('Error deleting promotion:', error);
      toastUi({
        title: "Error",
        description: error.message || "Failed to delete promotional email",
        variant: "destructive",
      });
    }
  };

  const formatExpiryTime = (expiresAt: string | null) => {
    if (!expiresAt) return "No expiry";
    
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day";
    return `${diffDays} days`;
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'order_confirmation':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Order</Badge>;
      case 'shipping':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Shipping</Badge>;
      case 'promotion':
        return <Badge variant="default">Promotion</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'inbox':
        return <Badge variant="outline" className="text-xs">Inbox</Badge>;
      case 'promotional':
        return <Badge variant="outline" className="text-xs">Promo</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{source}</Badge>;
    }
  };

  const filteredPromotions = promotions
    .filter((promo) => {
      const matchesSearch = promo.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           promo.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || 
                           (filterStatus === "active" && !promo.is_expired) ||
                           (filterStatus === "expired" && promo.is_expired);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "latest") {
        return new Date(b.received_date).getTime() - new Date(a.received_date).getTime();
      }
      return a.brand_name.localeCompare(b.brand_name);
    });

  // Pagination logic
  const totalItems = filteredPromotions.length;
  const currentItemsPerPage = showExpanded ? 25 : 10;
  const totalPages = Math.ceil(totalItems / currentItemsPerPage);
  const startIndex = (currentPage - 1) * currentItemsPerPage;
  const endIndex = startIndex + currentItemsPerPage;
  const currentPromotions = filteredPromotions.slice(startIndex, endIndex);
  
  const handleShowMore = () => {
    setShowExpanded(true);
    setCurrentPage(1); // Reset to first page when expanding
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getBrandInitial = (brand: string) => brand.charAt(0).toUpperCase();

  if (loading || scrapedLoading) {
    return (
      <div className="space-y-6">
        <GmailConnector />
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your promotional emails...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (promotions.length === 0 && scrapedPromotions.length === 0) {
    return (
      <div className="space-y-6">
        <GmailConnector />
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No promotional emails found</h3>
                <p className="text-muted-foreground">
                  Connect your Gmail account and scan your emails to get started!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GmailConnector />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotions</h1>
          <p className="text-muted-foreground mt-2">
            Manage your promotional emails and brand communications
          </p>
        </div>
        <Button onClick={handleManualScrape} disabled={scrapedLoading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Scrape Websites
        </Button>
      </div>

      {/* Direct Site Promotions Section */}
      {scrapedPromotions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <CardTitle>Direct Site Promotions</CardTitle>
              <Badge variant="secondary">{scrapedPromotions.length}</Badge>
            </div>
            <CardDescription>
              Latest promotions found on brand websites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {scrapedPromotions.map((promotion) => (
                <Card key={promotion.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {promotion.brand_name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        <Globe className="w-3 h-3 mr-1" />
                        Live
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">
                        {promotion.promotion_title}
                      </h3>
                      {promotion.promotion_description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {promotion.promotion_description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {promotion.discount_percentage && (
                        <Badge variant="default">
                          {promotion.discount_percentage} Off
                        </Badge>
                      )}
                      {promotion.discount_code && (
                        <Badge variant="secondary">
                          Code: {promotion.discount_code}
                        </Badge>
                      )}
                      {promotion.expires_at && (
                        <Badge variant="outline" className="text-xs">
                          Expires: {new Date(promotion.expires_at).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-muted-foreground">
                        Found: {new Date(promotion.scraped_at).toLocaleDateString()}
                      </div>
                      {promotion.promotion_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={promotion.promotion_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-3 h-3 mr-1" />
                            Visit
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gmail Promotions</CardTitle>
          <CardDescription>
            {showExpanded 
              ? `Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems} promotional emails`
              : `Showing ${Math.min(10, totalItems)} of ${totalItems} promotional emails from Gmail`
            }
          </CardDescription>
        </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest First</SelectItem>
                <SelectItem value="brand">Brand A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} item{selectedIds.size === 1 ? '' : 's'} selected
              </span>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteSelected}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={currentPromotions.length > 0 && selectedIds.size === currentPromotions.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-16">Brand</TableHead>
                <TableHead>Brand Name</TableHead>
                <TableHead>Subject Line</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Order Info</TableHead>
                <TableHead>Expires In</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {currentPromotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(promotion.id)}
                        onCheckedChange={(checked) => handleSelectOne(promotion.id, !!checked)}
                        aria-label={`Select ${promotion.brand_name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {getBrandInitial(promotion.brand_name)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell 
                      className="font-medium cursor-pointer hover:text-primary hover:underline"
                      onClick={() => navigate(`/brand-promotions/${encodeURIComponent(promotion.brand_name)}`)}
                    >
                      {promotion.brand_name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{promotion.subject}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getCategoryBadge(promotion.email_category)}
                        {getSourceBadge(promotion.email_source)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {promotion.email_category === 'order_confirmation' && (
                        <div className="text-sm space-y-1">
                          {promotion.order_number && (
                            <div className="font-mono text-xs">#{promotion.order_number}</div>
                          )}
                          {promotion.order_total && (
                            <div className="font-semibold">{promotion.order_total}</div>
                          )}
                          {promotion.order_items && (
                            <div className="text-muted-foreground text-xs">{promotion.order_items}</div>
                          )}
                        </div>
                      )}
                      {promotion.email_category !== 'order_confirmation' && (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {promotion.email_category === 'promotion' ? (
                        <Badge variant={promotion.is_expired ? "destructive" : "default"}>
                          {formatExpiryTime(promotion.expires_at)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Email
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteSingle(promotion.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col gap-4 mt-6">
          {/* Show More Button (only when showing 10 items and there are more than 10) */}
          {!showExpanded && totalItems > 10 && (
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={handleShowMore}
                className="min-w-32"
              >
                Show More ({Math.min(25, totalItems)} of {totalItems})
              </Button>
            </div>
          )}
          
          {/* Pagination (when showing 25 per page and there are more than 25) */}
          {(showExpanded && totalPages > 1) && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} promotions
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      </Card>
    </div>
  );
}