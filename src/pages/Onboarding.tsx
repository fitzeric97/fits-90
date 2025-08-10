import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Copy, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    id: "welcome",
    title: "Welcome to Fits!",
    description: "Your fashion organization companion is ready",
    completed: false,
  },
  {
    id: "closet",
    title: "Build Your Digital Closet",
    description: "Add items by photo upload or product URLs",
    completed: false,
  },
  {
    id: "likes",
    title: "Save Items You Love",
    description: "Like and organize items from any website",
    completed: false,
  },
  {
    id: "brands",
    title: "Follow Brand Promotions",
    description: "Add websites to track deals and promotions",
    completed: false,
  },
];

export default function Onboarding() {
  const [emailCopied, setEmailCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  
  const fitsEmail = "jamie@myfits.co";

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">F</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome, Jamie!</h1>
          <p className="text-muted-foreground">
            Let's get you set up with your new Fits inbox
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Your Fits Email is Ready
            </CardTitle>
            <CardDescription>
              Use this email address for all your brand newsletter signups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <span className="font-mono text-lg flex-1">{fitsEmail}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(fitsEmail)}
              >
                {emailCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Setup Guide</CardTitle>
            <CardDescription>
              Follow these steps to start organizing your promotional emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  index === currentStep ? "bg-primary/5 border border-primary/20" : ""
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step.completed || index === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.completed ? "✓" : index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to your favorite brand websites</li>
              <li>Update your email preferences to use {fitsEmail}</li>
              <li>We'll organize the promotions here so your inbox stays clean!</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => navigate("/home")} variant="outline" className="flex-1">
              Skip Setup
            </Button>
            <Button onClick={nextStep} className="flex-1">
              {currentStep === steps.length - 1 ? "Get Started" : "Next Step"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}