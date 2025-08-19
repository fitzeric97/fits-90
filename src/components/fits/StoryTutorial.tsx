import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Instagram, Smartphone, Share, ArrowRight, X } from "lucide-react";

interface StoryTutorialProps {
  open: boolean;
  onClose: () => void;
}

export function StoryTutorial({ open, onClose }: StoryTutorialProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Instagram className="w-12 h-12 text-pink-500" />,
      title: "Share Your Style",
      description: "Turn your fits into beautiful Instagram story images that showcase your style and tagged items.",
      image: "/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png"
    },
    {
      icon: <Smartphone className="w-12 h-12 text-blue-500" />,
      title: "Mobile Optimized",
      description: "Images are created at the perfect 9:16 Instagram story dimensions (1080x1920) for the best quality.",
      image: "/lovable-uploads/81e99535-5f12-4a74-b1ad-7e5b3e2fd668.png"
    },
    {
      icon: <Share className="w-12 h-12 text-green-500" />,
      title: "Easy Sharing",
      description: "Tap 'Share to Story' to save the image to your device, then upload it to your Instagram story with your personal touch.",
      image: "/lovable-uploads/e4a1b3bc-c73c-496e-b3a5-5f401fc40604.png"
    }
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Mark tutorial as completed in localStorage
      localStorage.setItem('fits-story-tutorial-completed', 'true');
      onClose();
    }
  };

  const skipTutorial = () => {
    localStorage.setItem('fits-story-tutorial-completed', 'true');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
        <div className="relative">
          <Button
            onClick={skipTutorial}
            variant="ghost"
            size="sm"
            className="absolute -top-2 -right-2 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="text-center space-y-6 p-4">
            <div className="flex justify-center mb-4">
              {steps[step].icon}
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-amber-800">
                {steps[step].title}
              </h2>
              <p className="text-amber-700 leading-relaxed">
                {steps[step].description}
              </p>
            </div>

            {/* Visual Example */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-200">
              <div className="w-full h-32 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                <img 
                  src={steps[step].image}
                  alt="Tutorial step"
                  className="h-16 w-16 rounded-lg object-cover"
                />
              </div>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 py-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === step
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 scale-125'
                      : 'bg-amber-200'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
              <Button
                onClick={skipTutorial}
                variant="ghost"
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
              >
                Skip Tutorial
              </Button>

              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 shadow-lg animate-fade-in"
              >
                {step < steps.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  'Get Started!'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}