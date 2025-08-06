import { useState, useEffect } from "react";
import { Search, Filter, MoreHorizontal, Eye, Trash2, CheckSquare, Square } from "lucide-react";
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
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredPromotions.map(p => p.id)));
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

      toast({
        title: "Success",
        description: `Deleted ${selectedIds.size} promotional email${selectedIds.size === 1 ? '' : 's'}`,
      });

      setSelectedIds(new Set());
      await fetchPromotions();
    } catch (error: any) {
      console.error('Error deleting promotions:', error);
      toast({
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

      toast({
        title: "Success",
        description: "Promotional email deleted",
      });

      await fetchPromotions();
    } catch (error: any) {
      console.error('Error deleting promotion:', error);
      toast({
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

  const getBrandInitial = (brand: string) => brand.charAt(0).toUpperCase();

  if (loading) {
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

  if (promotions.length === 0) {
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
      <Card>
        <CardHeader>
          <CardTitle>All Promotions</CardTitle>
          <CardDescription>
            Your promotional emails from Gmail ({promotions.length} total)
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
                    checked={filteredPromotions.length > 0 && selectedIds.size === filteredPromotions.length}
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
                {filteredPromotions.map((promotion) => (
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
                    <TableCell className="font-medium">{promotion.brand_name}</TableCell>
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

          {filteredPromotions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No promotions found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}