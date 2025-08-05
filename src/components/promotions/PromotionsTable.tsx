import { useState, useEffect } from "react";
import { Search, Filter, MoreHorizontal, Eye, Trash2 } from "lucide-react";
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

interface Promotion {
  id: string;
  brand_name: string;
  subject: string;
  expires_at: string | null;
  is_expired: boolean;
  received_date: string;
  sender_name: string;
  snippet: string;
}

export function PromotionsTable() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const { user } = useAuth();

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

      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
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
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Brand</TableHead>
                <TableHead>Brand Name</TableHead>
                <TableHead>Subject Line</TableHead>
                <TableHead>Expires In</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredPromotions.map((promotion) => (
                  <TableRow key={promotion.id}>
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
                      <Badge variant={promotion.is_expired ? "destructive" : "default"}>
                        {formatExpiryTime(promotion.expires_at)}
                      </Badge>
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
                        <DropdownMenuItem className="text-destructive">
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