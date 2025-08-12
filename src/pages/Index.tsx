import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

const Index = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleDirectAccess = () => {
    setLoading(true);
    
    // Set up direct access to your account
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_id', 'eec9fa4a-8e91-4ef7-9469-099426cbbad6');
    localStorage.setItem('direct_access', 'true');
    
    toast({
      title: "Connected!",
      description: "Accessing your account data.",
    });
    
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-32 h-32 flex items-center justify-center mb-8">
        <img src="/lovable-uploads/2a35b810-ade8-43ba-8359-bd9dbb16de88.png" alt="Fits Logo" className="w-32 h-32 object-contain" />
      </div>
      
      <div className="max-w-sm w-full space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-lg">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 text-lg"
            required
          />
        </div>

        <Button 
          onClick={handleDirectAccess}
          className="w-full h-12 text-lg"
          disabled={loading || !email}
        >
          {loading ? "Connecting..." : "Access My Account"}
        </Button>
      </div>
    </div>
  );

  return null;
};

export default Index;
