import { useState } from "react";
import { ChevronDown, ChevronRight, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Brand {
  name: string;
  promoCount: number;
}

const mockBrands: Brand[] = [
  { name: "Nike", promoCount: 12 },
  { name: "Everlane", promoCount: 8 },
  { name: "Uniqlo", promoCount: 15 },
  { name: "Zara", promoCount: 6 },
  { name: "LL Bean", promoCount: 4 },
  { name: "Patagonia", promoCount: 3 },
];

export function BrandFilterSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  return (
    <Card className="w-64">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Brands</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant={selectedBrand === null ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setSelectedBrand(null)}
        >
          All Brands
          <span className="ml-auto text-xs text-muted-foreground">
            {mockBrands.reduce((sum, brand) => sum + brand.promoCount, 0)}
          </span>
        </Button>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Brand List
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 ml-4">
            {mockBrands.map((brand) => (
              <div key={brand.name} className="flex items-center justify-between group">
                <Button
                  variant={selectedBrand === brand.name ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-1 justify-start"
                  onClick={() => setSelectedBrand(brand.name)}
                >
                  <div className="w-5 h-5 bg-primary/10 rounded text-xs flex items-center justify-center mr-2">
                    {brand.name.charAt(0)}
                  </div>
                  {brand.name}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {brand.promoCount}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 ml-1"
                  title={`Unsubscribe from ${brand.name}`}
                >
                  <Unlink className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}