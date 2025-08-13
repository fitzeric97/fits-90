import { useState } from "react";
import { Upload, X, Shirt, Square, Scissors, Package, User, Footprints, Crown, Watch, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ItemFormData {
  title?: string;
  brandName?: string;
  price?: string;
  size?: string;
  color?: string;
  category?: string;
  description?: string;
  purchaseDate?: string;
}

interface ItemFormProps {
  initialData?: ItemFormData;
  onDataChange: (data: ItemFormData) => void;
  onImageSelect?: (file: File) => void;
  imagePreview?: string | null;
  onRemoveImage?: () => void;
  showSizeColor?: boolean;
  showPurchaseDate?: boolean;
  brandRequired?: boolean;
  showImageUpload?: boolean;
}

export function ItemForm({
  initialData = {},
  onDataChange,
  onImageSelect,
  imagePreview,
  onRemoveImage,
  showSizeColor = true,
  showPurchaseDate = true,
  brandRequired = false,
  showImageUpload = false
}: ItemFormProps) {
  const [formData, setFormData] = useState<ItemFormData>(initialData);

  const updateField = (field: keyof ItemFormData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataChange(newData);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageSelect) {
      onImageSelect(file);
    }
  };

  const categories = [
    { value: "shirts", label: "Shirts", icon: Shirt },
    { value: "t-shirts", label: "T-Shirts", icon: Shirt },
    { value: "polo-shirts", label: "Polo Shirts", icon: Shirt },
    { value: "button-shirts", label: "Button Shirts", icon: Shirt },
    { value: "jeans", label: "Jeans", icon: Square },
    { value: "pants", label: "Pants", icon: Square },
    { value: "shorts", label: "Shorts", icon: Scissors },
    { value: "jackets", label: "Jackets", icon: Package },
    { value: "sweaters", label: "Sweaters", icon: Package },
    { value: "hoodies", label: "Hoodies", icon: Package },
    { value: "activewear", label: "Activewear", icon: User },
    { value: "shoes", label: "Shoes", icon: Footprints },
    { value: "hats", label: "Hats", icon: Crown },
    { value: "accessories", label: "Accessories", icon: Watch },
    { value: "fragrances", label: "Fragrances", icon: Sparkles },
    { value: "colognes", label: "Colognes", icon: Sparkles },
  ];

  return (
    <div className="space-y-4">
      {/* Image Upload Section */}
      {showImageUpload && (
        <div className="space-y-2">
          <Label htmlFor="image">Upload Image</Label>
          <div className="border-2 border-dashed rounded-lg p-6">
            {imagePreview ? (
              <div className="space-y-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRemoveImage}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Image
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload or drag and drop an image
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="max-w-xs mx-auto"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Product Name</Label>
          <Input
            id="title"
            placeholder="Product name"
            value={formData.title || ""}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brandName">
            Brand {brandRequired ? "*" : ""}
          </Label>
          <Input
            id="brandName"
            placeholder="Brand name"
            value={formData.brandName || ""}
            onChange={(e) => updateField("brandName", e.target.value)}
            required={brandRequired}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            placeholder="$99.99"
            value={formData.price || ""}
            onChange={(e) => updateField("price", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select 
            value={formData.category || ""} 
            onValueChange={(value) => updateField("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(({ value, label, icon: Icon }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {showSizeColor && (
          <>
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                placeholder="M, L, 32, etc."
                value={formData.size || ""}
                onChange={(e) => updateField("size", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="Blue, Red, etc."
                value={formData.color || ""}
                onChange={(e) => updateField("color", e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {showPurchaseDate && (
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate || ""}
              onChange={(e) => updateField("purchaseDate", e.target.value)}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Additional details about this item..."
            value={formData.description || ""}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}