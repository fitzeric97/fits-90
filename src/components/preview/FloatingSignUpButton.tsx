import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface FloatingSignUpButtonProps {
  onClick: () => void;
}

export function FloatingSignUpButton({ onClick }: FloatingSignUpButtonProps) {
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Button
        onClick={onClick}
        size="lg"
        className="h-14 px-6 rounded-full shadow-lg bg-fits-blue hover:bg-fits-blue/90 text-fits-blue-foreground flex items-center gap-2"
      >
        <UserPlus className="h-5 w-5" />
        <span className="font-semibold">Sign Up Now</span>
      </Button>
    </div>
  );
}