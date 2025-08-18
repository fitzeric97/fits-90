import { StyleInspirationsGrid } from '@/components/inspirations/StyleInspirationsGrid';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Sparkles } from 'lucide-react';

export default function StyleInspirations() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Style Inspirations
            </h1>
            <p className="text-muted-foreground">
              Discover curated looks and trending styles
            </p>
          </div>
        </div>

        {/* Featured Section */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Trending This Week</h2>
          <p className="text-muted-foreground mb-4">
            The most popular looks from our community
          </p>
          <StyleInspirationsGrid limit={6} />
        </div>

        {/* All Inspirations */}
        <div>
          <h2 className="text-2xl font-bold mb-4">All Inspirations</h2>
          <StyleInspirationsGrid />
        </div>
      </div>
    </DashboardLayout>
  );
}