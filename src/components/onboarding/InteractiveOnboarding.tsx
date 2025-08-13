import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Sparkles, Upload, Heart, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Fits!",
    description: "Your fashion organization companion",
    icon: Sparkles,
    completed: false,
  },
  {
    id: "closet",
    title: "Build Your Digital Closet",
    description: "Add items by photo upload or product URLs",
    icon: Upload,
    completed: false,
  },
  {
    id: "likes",
    title: "Save Items You Love",
    description: "Like and organize items from any website",
    icon: Heart,
    completed: false,
  },
  {
    id: "brands",
    title: "Follow Brand Promotions",
    description: "Add websites to track deals and promotions",
    icon: Globe,
    completed: false,
  },
];

export default function InteractiveOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepContent, setStepContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    generateStepContent();
  }, [currentStep, userProfile]);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setUserProfile(profile);
    }
  };

  const generateStepContent = async () => {
    if (!steps[currentStep]) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-onboarding', {
        body: {
          userProfile,
          step: steps[currentStep].id
        }
      });

      if (error) throw error;
      setStepContent(data.content);
    } catch (error) {
      console.error('Error generating content:', error);
      setStepContent(getDefaultContent(steps[currentStep].id));
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = (stepId: string) => {
    const defaults = {
      welcome: "Welcome to Fits! We're excited to help you organize your fashion journey and discover amazing deals from your favorite brands.",
      closet: "Start building your digital closet by adding items you own. Upload photos or paste product URLs - we'll help you keep track of everything in your wardrobe.",
      likes: "Save items you love from any website! Simply paste the URL and we'll organize your wishlist so you never lose track of those perfect pieces.",
      brands: "Follow your favorite brands by adding their websites. We'll automatically track promotions and deals so you never miss a great offer."
    };
    return defaults[stepId as keyof typeof defaults] || "Let's continue your Fits journey!";
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      }
      
      toast({
        title: "Welcome to Fits!",
        description: "You're all set up and ready to start organizing your fashion journey.",
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigate("/dashboard");
    }
  };

  const skipOnboarding = () => {
    navigate("/dashboard");
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData?.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">F</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {userProfile?.display_name ? `Welcome, ${userProfile.display_name.split(' ')[0]}!` : 'Welcome to Fits!'}
          </h1>
          <p className="text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {Icon && <Icon className="h-6 w-6 text-primary" />}
            </div>
            <CardTitle>{currentStepData?.title}</CardTitle>
            <CardDescription>{currentStepData?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              {loading ? (
                <div className="py-8">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground leading-relaxed">{stepContent}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex gap-2 justify-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={skipOnboarding} 
              variant="outline" 
              className="flex-1"
            >
              Skip Setup
            </Button>
            
            {currentStep > 0 && (
              <Button onClick={prevStep} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            
            <Button onClick={nextStep} className="flex-1">
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}