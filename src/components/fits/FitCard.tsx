import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { TagIcon, MoreHorizontal } from "lucide-react";
import { TagClosetDialog } from "./TagClosetDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Fit {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  is_instagram_url: boolean;
  created_at: string;
}

interface FitCardProps {
  fit: Fit;
  onUpdate: () => void;
}

async function deleteFit(fitId: string) {
  const response = await fetch(`https://ijawvesjgyddyiymiahk.supabase.co/rest/v1/fits?id=eq.${fitId}`, {
    method: 'DELETE',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqYXd2ZXNqZ3lkZHlpeW1pYWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzQ2MzgsImV4cCI6MjA3MDAxMDYzOH0.ZFG9EoTGU_gar6cGnu4LYAcsfRXtQQ0yLeq7E3g0CE4',
      'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
      'Content-Type': 'application/json'
    }
  });
  return response.ok;
}

export function FitCard({ fit, onUpdate }: FitCardProps) {
  const [showTagDialog, setShowTagDialog] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const success = await deleteFit(fit.id);
      if (!success) throw new Error('Failed to delete');

      toast({
        title: "Fit deleted",
        description: "Your fit has been removed.",
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting fit:', error);
      toast({
        title: "Error",
        description: "Failed to delete fit. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="group overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <AspectRatio ratio={1}>
              <img
                src={fit.image_url}
                alt={fit.caption || "Fit"}
                className="object-cover w-full h-full"
              />
            </AspectRatio>
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowTagDialog(true)}
              >
                <TagIcon className="h-4 w-4 mr-1" />
                Tag Closet
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    Delete Fit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {fit.is_instagram_url && (
              <Badge variant="secondary" className="absolute top-2 right-2">
                Instagram
              </Badge>
            )}
          </div>
          
          {fit.caption && (
            <div className="p-3">
              <p className="text-sm text-muted-foreground">{fit.caption}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <TagClosetDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        fitId={fit.id}
      />
    </>
  );
}