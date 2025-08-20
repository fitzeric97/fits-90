import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface PreviewSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onInteraction: () => void;
}

export function PreviewSection({ title, icon, children, onInteraction }: PreviewSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      
      <div 
        className="cursor-pointer transition-opacity hover:opacity-80"
        onClick={onInteraction}
      >
        {children}
      </div>
    </div>
  );
}