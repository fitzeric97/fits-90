import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuickAddFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: any) => void;
  type: 'like' | 'closet';
}

const scrapeUrl = async (url: string) => {
  try {
    // Call your existing add-url-to-likes edge function for scraping
    const { data, error } = await supabase.functions.invoke('add-url-to-likes', {
      body: { url }
    });
    
    if (error) throw error;
    
    return {
      title: data?.title || '',
      brand: data?.brand_name || '',
      price: data?.price || '',
      image: data?.image_url || '',
      description: data?.description || ''
    };
  } catch (error) {
    console.error('Error scraping URL:', error);
    return {
      title: '',
      brand: '',
      price: '',
      image: '',
      description: ''
    };
  }
};

export function QuickAddFlow({ open, onOpenChange, onComplete, type }: QuickAddFlowProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    url: '',
    title: '',
    brand_name: '',
    price: '',
    image_url: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<any>(null);
  const { toast } = useToast();

  const steps = [
    {
      key: 'url',
      title: 'Paste the product link',
      subtitle: 'We\'ll grab the details automatically',
      type: 'url',
      placeholder: 'https://...',
      required: true
    },
    {
      key: 'title',
      title: 'Product name',
      subtitle: 'Make sure this looks right',
      type: 'text',
      placeholder: 'e.g., Classic White Sneakers',
      required: true,
      editable: true
    },
    {
      key: 'brand_name',
      title: 'Brand',
      subtitle: 'Which brand is this?',
      type: 'text',
      placeholder: 'e.g., Nike, Zara, etc.',
      required: true,
      editable: true
    },
    {
      key: 'price',
      title: 'Price',
      subtitle: 'How much does it cost?',
      type: 'text',
      placeholder: '$99',
      required: false,
      editable: true
    }
  ];

  const currentStep = steps[step];

  const handleUrlSubmit = async () => {
    setLoading(true);
    
    try {
      console.log('Scraping URL:', data.url);
      const scraped = await scrapeUrl(data.url);
      setScrapedData(scraped);
      setData({
        ...data,
        title: scraped.title || '',
        brand_name: scraped.brand || '',
        price: scraped.price || '',
        image_url: scraped.image || '',
        description: scraped.description || ''
      });
      setStep(1);
      
      if (scraped.title || scraped.brand) {
        toast({
          title: "Details found!",
          description: "We've pre-filled the information. You can edit it if needed.",
        });
      }
    } catch (error) {
      console.error('Scraping error:', error);
      // If scraping fails, still move forward but with empty fields
      setStep(1);
      toast({
        title: "Couldn't fetch details",
        description: "No worries! You can enter them manually.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 0) {
      handleUrlSubmit();
    } else if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(data);
      onOpenChange(false);
      // Reset form
      setStep(0);
      setData({
        url: '',
        title: '',
        brand_name: '',
        price: '',
        image_url: '',
        description: ''
      });
      setScrapedData(null);
    }
  };

  const isCurrentStepValid = () => {
    const value = data[currentStep.key as keyof typeof data];
    if (!currentStep.required) return true;
    return value && value.trim().length > 0;
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setStep(0);
    setData({
      url: '',
      title: '',
      brand_name: '',
      price: '',
      image_url: '',
      description: ''
    });
    setScrapedData(null);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[80vh] px-0">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="flex flex-col h-full pt-8">
          {/* Header */}
          <div className="px-6 mb-8">
            <h2 className="text-2xl font-bold mb-2">{currentStep.title}</h2>
            <p className="text-muted-foreground">{currentStep.subtitle}</p>
          </div>

          {/* Input Section */}
          <div className="flex-1 px-6">
            {step === 0 ? (
              // URL input (first step)
              <Input
                type="url"
                placeholder={currentStep.placeholder}
                value={data[currentStep.key as keyof typeof data]}
                onChange={(e) => setData({ ...data, [currentStep.key]: e.target.value })}
                className="text-lg h-14"
                autoFocus
              />
            ) : (
              // Editable scraped data
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={currentStep.placeholder}
                    value={data[currentStep.key as keyof typeof data]}
                    onChange={(e) => setData({ ...data, [currentStep.key]: e.target.value })}
                    className="text-lg h-14 pr-12"
                    autoFocus
                  />
                  {scrapedData && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Show image preview if available */}
                {data.image_url && step === 1 && (
                  <div className="mt-4">
                    <img 
                      src={data.image_url} 
                      alt={data.title}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Show scraped vs edited indicator */}
                {scrapedData && scrapedData[currentStep.key.replace('_name', '')] !== data[currentStep.key as keyof typeof data] && (
                  <p className="text-xs text-muted-foreground">
                    Original: {scrapedData[currentStep.key.replace('_name', '')]}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-8 space-y-3">
            <Button
              size="lg"
              className="w-full h-14 text-lg"
              onClick={handleNext}
              disabled={!isCurrentStepValid() || loading}
            >
              {loading ? (
                "Loading..."
              ) : step === steps.length - 1 ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Add to {type === 'like' ? 'Likes' : 'Closet'}
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            
            {step > 0 && (
              <Button
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}