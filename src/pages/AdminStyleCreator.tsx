import React, { useState, useRef } from 'react';
import { Upload, Plus, X, Tag, DollarSign, Link, Image, Save, Eye, ArrowLeft } from 'lucide-react';
import { useCreateInspiration } from '@/hooks/useStyleInspirations';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AdminStyleCreator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createInspirationMutation = useCreateInspiration();

  const [inspiration, setInspiration] = useState({
    title: '',
    description: '',
    source_url: '',
    image_url: '',
    category: 'casual',
    season: 'all-season',
    tags: [],
    products: []
  });

  const [currentProduct, setCurrentProduct] = useState({
    product_name: '',
    brand: '',
    product_url: '',
    price: '',
    product_type: 'top',
    image_url: '',
    affiliate_link: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `inspiration-${Date.now()}.${fileExt}`;
      const filePath = `inspirations/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      setImagePreview(publicUrl);
      setInspiration({ ...inspiration, image_url: publicUrl });

      toast({
        description: 'Image uploaded successfully!'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to upload image'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!inspiration.tags.includes(tagInput.trim())) {
        setInspiration({
          ...inspiration,
          tags: [...inspiration.tags, tagInput.trim()]
        });
      }
      setTagInput('');
    }
  };

  const removeTag = (indexToRemove) => {
    setInspiration({
      ...inspiration,
      tags: inspiration.tags.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleAddProduct = () => {
    if (currentProduct.product_name && currentProduct.product_url) {
      setInspiration({
        ...inspiration,
        products: [...inspiration.products, { ...currentProduct }]
      });
      setCurrentProduct({
        product_name: '',
        brand: '',
        product_url: '',
        price: '',
        product_type: 'top',
        image_url: '',
        affiliate_link: ''
      });
      setShowProductForm(false);
    }
  };

  const removeProduct = (indexToRemove) => {
    setInspiration({
      ...inspiration,
      products: inspiration.products.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inspiration.image_url || !inspiration.title) {
      toast({
        variant: 'destructive',
        description: 'Please provide a title and image'
      });
      return;
    }

    try {
      await createInspirationMutation.mutateAsync(inspiration);
      
      toast({
        description: 'Style inspiration created successfully!'
      });
      
      // Reset form
      setInspiration({
        title: '',
        description: '',
        source_url: '',
        image_url: '',
        category: 'casual',
        season: 'all-season',
        tags: [],
        products: []
      });
      setImagePreview('');
      
      // Navigate to inspirations page
      navigate('/inspirations');
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to create inspiration'
      });
    }
  };

  const categories = [
    'casual', 'formal', 'streetwear', 'minimalist', 'vintage', 
    'bohemian', 'business', 'athletic', 'party'
  ];

  const seasons = ['all-season', 'spring', 'summer', 'fall', 'winter'];
  const productTypes = ['top', 'bottom', 'shoes', 'accessory', 'outerwear'];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/inspirations')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inspirations
          </Button>
          <h1 className="text-3xl font-bold">Create Style Inspiration</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Image and Basic Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Image & Basic Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image Upload */}
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-64 object-cover rounded" 
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setImagePreview('');
                            setInspiration({ ...inspiration, image_url: '' });
                          }}
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center h-64 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {isUploading ? 'Uploading...' : 'Click to upload image'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          or paste image URL below
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </div>

                  {/* Image URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="image-url">Image URL</Label>
                    <Input
                      id="image-url"
                      type="url"
                      placeholder="Or paste image URL here"
                      value={inspiration.image_url}
                      onChange={(e) => {
                        setInspiration({ ...inspiration, image_url: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                    />
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="e.g., 'Casual Street Style'"
                      value={inspiration.title}
                      onChange={(e) => setInspiration({ ...inspiration, title: e.target.value })}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe this style inspiration..."
                      value={inspiration.description}
                      onChange={(e) => setInspiration({ ...inspiration, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Source URL */}
                  <div className="space-y-2">
                    <Label htmlFor="source-url">Source URL</Label>
                    <Input
                      id="source-url"
                      type="url"
                      placeholder="Pinterest, Instagram, etc."
                      value={inspiration.source_url}
                      onChange={(e) => setInspiration({ ...inspiration, source_url: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Categories and Products */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Categorization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category and Season */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={inspiration.category}
                        onValueChange={(value) => setInspiration({ ...inspiration, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Season</Label>
                      <Select
                        value={inspiration.season}
                        onValueChange={(value) => setInspiration({ ...inspiration, season: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {seasons.map(season => (
                            <SelectItem key={season} value={season}>
                              {season.split('-').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      type="text"
                      placeholder="Add tags (press Enter)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                    />
                    <div className="flex flex-wrap gap-2">
                      {inspiration.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTag(index)}
                            className="h-auto p-0 hover:bg-transparent"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Tagged Products ({inspiration.products.length})
                    </CardTitle>
                    <Button
                      type="button"
                      onClick={() => setShowProductForm(!showProductForm)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Product
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Product Form */}
                  {showProductForm && (
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <Input
                        placeholder="Product Name *"
                        value={currentProduct.product_name}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, product_name: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Brand"
                          value={currentProduct.brand}
                          onChange={(e) => setCurrentProduct({ ...currentProduct, brand: e.target.value })}
                        />
                        <Select
                          value={currentProduct.product_type}
                          onValueChange={(value) => setCurrentProduct({ ...currentProduct, product_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {productTypes.map(type => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        type="url"
                        placeholder="Product URL *"
                        value={currentProduct.product_url}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, product_url: e.target.value })}
                      />
                      <Input
                        placeholder="Price (e.g., $99.99)"
                        value={currentProduct.price}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleAddProduct}
                          size="sm"
                          disabled={!currentProduct.product_name || !currentProduct.product_url}
                        >
                          Add Product
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowProductForm(false)}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Products List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {inspiration.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-start p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.brand && `${product.brand} • `}
                            {product.product_type} 
                            {product.price && ` • ${product.price}`}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {inspiration.products.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-8">
                        No products added yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/inspirations')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createInspirationMutation.isPending || 
                !inspiration.image_url || 
                !inspiration.title ||
                isUploading
              }
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {createInspirationMutation.isPending ? 'Creating...' : 'Create Inspiration'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}