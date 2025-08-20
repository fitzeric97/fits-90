import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Edit, Trash2, Tag } from "lucide-react";

interface PreviewFitDetailDialogProps {
  fit: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUp: () => void;
}

export function PreviewFitDetailDialog({ 
  fit, 
  open, 
  onOpenChange,
  onSignUp 
}: PreviewFitDetailDialogProps) {
  if (!fit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Image */}
          <div className="relative">
            <img
              src={fit.image_url}
              alt={fit.caption || "Fit"}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>

          {/* Content */}
          <div className="space-y-4">
            {fit.caption && (
              <div>
                <h2 className="text-2xl font-bold">{fit.caption}</h2>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {fit.is_instagram_url ? 'Instagram' : 'Upload'}
              </Badge>
            </div>

            {fit.created_at && (
              <p className="text-sm text-muted-foreground">
                Created {new Date(fit.created_at).toLocaleDateString()}
              </p>
            )}

            {/* Tagged Items Preview */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Tagged Items</h3>
              <p className="text-sm text-muted-foreground">
                Sign up to see and manage tagged closet items for this fit
              </p>
            </div>
          </div>

          {/* Preview-only Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onSignUp}
              className="flex items-center gap-2"
            >
              <Tag className="h-4 w-4" />
              Tag Items (Sign up required)
            </Button>
            <Button
              variant="outline"
              onClick={onSignUp}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit (Sign up required)
            </Button>
            <Button
              variant="destructive"
              onClick={onSignUp}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete (Sign up required)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}