import { useState } from "react";
import { Search, Filter, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Promotion {
  id: string;
  brand: string;
  subject: string;
  expiresIn: string;
  isExpired: boolean;
  receivedDate: string;
  brandLogo?: string;
}

const mockPromotions: Promotion[] = [
  {
    id: "1",
    brand: "Nike",
    subject: "30% off new arrivals",
    expiresIn: "3 days",
    isExpired: false,
    receivedDate: "2024-08-02",
  },
  {
    id: "2",
    brand: "Everlane",
    subject: "Members get early access",
    expiresIn: "1 day",
    isExpired: false,
    receivedDate: "2024-08-03",
  },
  {
    id: "3",
    brand: "LL Bean",
    subject: "Free shipping + bundles",
    expiresIn: "Expired",
    isExpired: true,
    receivedDate: "2024-07-28",
  },
  {
    id: "4",
    brand: "Uniqlo",
    subject: "Summer sale up to 50% off",
    expiresIn: "5 days",
    isExpired: false,
    receivedDate: "2024-08-01",
  },
];

export function PromotionsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  const filteredPromotions = mockPromotions
    .filter((promo) => {
      const matchesSearch = promo.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           promo.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || 
                           (filterStatus === "active" && !promo.isExpired) ||
                           (filterStatus === "expired" && promo.isExpired);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "latest") {
        return new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime();
      }
      return a.brand.localeCompare(b.brand);
    });

  const getBrandInitial = (brand: string) => brand.charAt(0).toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Promotions</CardTitle>
        <CardDescription>
          Manage your promotional emails in one place
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
                        {getBrandInitial(promotion.brand)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{promotion.brand}</TableCell>
                  <TableCell>{promotion.subject}</TableCell>
                  <TableCell>
                    <Badge variant={promotion.isExpired ? "destructive" : "default"}>
                      {promotion.expiresIn}
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
  );
}