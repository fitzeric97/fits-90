import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Heart, ShirtIcon, ExternalLink, Camera, Store, UserPlus } from "lucide-react";
import { FallbackImage } from "@/components/ui/fallback-image";
import { useToast } from "@/hooks/use-toast";
import { FollowButton } from "@/components/social/FollowButton";

interface Profile {
  id: string;
  display_name: string | null;
  myfits_email: string | null;
}

interface UserLike {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  uploaded_image_url: string | null;
  url: string;
  brand_name: string | null;
  price: string | null;
  category: string | null;
  created_at: string;
}

interface ClosetItem {
  id: string;
  product_name: string | null;
  brand_name: string;
  product_description: string | null;
  product_image_url: string | null;
  uploaded_image_url: string | null;
  category: string | null;
  color: string | null;
  size: string | null;
  price: string | null;
  created_at: string;
}

interface Fit {
  id: string;
  image_url: string;
  caption: string | null;
  is_instagram_url: boolean;
  created_at: string;
}

interface Brand {
  brand_name: string;
  count: number;
}

const ConnectionProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [likes, setLikes] = useState<UserLike[]>([]);
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [fits, setFits] = useState<Fit[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "alphabetical">("newest");
  const [activeTab, setActiveTab] = useState("fits");
  const [isConnected, setIsConnected] = useState(false);

  // Reset search when switching tabs
  useEffect(() => {
    setSearchTerm("");
  }, [activeTab]);

  useEffect(() => {
    if (!userId || !user) return;
    fetchData();
  }, [userId, user]);

  const fetchData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Check if users are connected
      const { data: connection, error: connectionError } = await supabase
        .from("user_connections")
        .select("*")
        .or(`and(user_id.eq.${user?.id},connected_user_id.eq.${userId}),and(user_id.eq.${userId},connected_user_id.eq.${user?.id})`)
        .eq("status", "accepted")
        .maybeSingle();

      if (connectionError) {
        console.error("Connection check error:", connectionError);
        toast({
          title: "Error",
          description: "Failed to verify connection",
          variant: "destructive",
        });
        return;
      }

      const isConnected = !!connection;
      setIsConnected(isConnected);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, myfits_email")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch likes (only if connected)
      if (isConnected) {
        const { data: likesData, error: likesError } = await supabase
          .from("user_likes")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (likesError) {
          console.error("Likes fetch error:", likesError);
        } else {
          setLikes(likesData || []);
        }

        // Fetch closet items (only if connected)
        const { data: closetData, error: closetError } = await supabase
          .from("closet_items")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (closetError) {
          console.error("Closet fetch error:", closetError);
        } else {
          setClosetItems(closetData || []);
        }

        // Calculate brands from closet items and likes (only if connected)
        const brandCounts: { [key: string]: number } = {};
        
        // Count brands from closet items
        closetData?.forEach(item => {
          if (item.brand_name) {
            brandCounts[item.brand_name] = (brandCounts[item.brand_name] || 0) + 1;
          }
        });

        // Count brands from likes
        likesData?.forEach(like => {
          if (like.brand_name) {
            brandCounts[like.brand_name] = (brandCounts[like.brand_name] || 0) + 1;
          }
        });

        // Convert to array and sort by count
        const brandsArray = Object.entries(brandCounts)
          .map(([brand_name, count]) => ({ brand_name, count }))
          .sort((a, b) => b.count - a.count);

        setBrands(brandsArray);
      }

      // Fetch fits (always public)
      const { data: fitsData, error: fitsError } = await supabase
        .from("fits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fitsError) {
        console.error("Fits fetch error:", fitsError);
      } else {
        setFits(fitsData || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortItems = (items: any[]) => {
    let filtered = items.filter(item => {
      const searchableText = [
        item.title || item.product_name || item.caption || "",
        item.brand_name || "",
        item.description || item.product_description || "",
        item.category || ""
      ].join(" ").toLowerCase();
      
      return searchableText.includes(searchTerm.toLowerCase());
    });

    switch (sortBy) {
      case "newest":
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "oldest":
        return filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "alphabetical":
        return filtered.sort((a, b) => {
          const aName = (a.title || a.product_name || a.caption || "").toLowerCase();
          const bName = (b.title || b.product_name || b.caption || "").toLowerCase();
          return aName.localeCompare(bName);
        });
      default:
        return filtered;
    }
  };

  const filterAndSortBrands = (brands: Brand[]) => {
    let filtered = brands.filter(brand =>
      brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortBy) {
      case "newest":
      case "oldest":
        return filtered.sort((a, b) => b.count - a.count); // Sort by count for brands
      case "alphabetical":
        return filtered.sort((a, b) => a.brand_name.toLowerCase().localeCompare(b.brand_name.toLowerCase()));
      default:
        return filtered;
    }
  };

  const getImageUrl = (item: UserLike | ClosetItem | Fit) => {
    if ('uploaded_image_url' in item && item.uploaded_image_url) {
      return item.uploaded_image_url;
    }
    if ('image_url' in item && item.image_url) {
      return item.image_url;
    }
    if ('product_image_url' in item && item.product_image_url) {
      return item.product_image_url;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {profile?.display_name || "User Profile"}
            </h1>
            {profile?.myfits_email && (
              <p className="text-muted-foreground">{profile.myfits_email}</p>
            )}
          </div>
          {!isConnected && userId !== user?.id && (
            <FollowButton 
              targetUserId={userId!}
              targetUsername={profile?.display_name || profile?.myfits_email || "User"}
              size="default"
            />
          )}
        </div>

        {/* Connection Status Notice */}
        {!isConnected && userId !== user?.id && (
          <div className="bg-muted/50 border border-muted rounded-lg p-4 text-center">
            <UserPlus className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Connect with {profile?.display_name || "this user"} to see their closet, likes, and favorite brands
            </p>
            <FollowButton 
              targetUserId={userId!}
              targetUsername={profile?.display_name || profile?.myfits_email || "User"}
              size="sm"
            />
          </div>
        )}

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger 
              value="fits" 
              className="flex items-center gap-2 transition-all"
              title="View outfit posts"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Fits</span> ({fits.length})
            </TabsTrigger>
            <TabsTrigger 
              value="closet" 
              className="flex items-center gap-2 transition-all" 
              disabled={!isConnected}
              title={!isConnected ? "Connect to view closet" : "View closet items"}
            >
              <ShirtIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Closet</span> ({closetItems.length})
            </TabsTrigger>
            <TabsTrigger 
              value="likes" 
              className="flex items-center gap-2 transition-all" 
              disabled={!isConnected}
              title={!isConnected ? "Connect to view likes" : "View liked items"}
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Likes</span> ({likes.length})
            </TabsTrigger>
            <TabsTrigger 
              value="brands" 
              className="flex items-center gap-2 transition-all" 
              disabled={!isConnected}
              title={!isConnected ? "Connect to view brands" : "View favorite brands"}
            >
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Brands</span> ({brands.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fits" className="mt-6">
            {fits.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No fits yet</h3>
                <p className="text-muted-foreground">This user hasn't posted any fits yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterAndSortItems(fits).map((fit) => (
                  <Card key={fit.id} className="overflow-hidden">
                    <CardHeader className="p-0">
                      <div className="aspect-square relative">
                        <FallbackImage
                          src={getImageUrl(fit)}
                          alt={fit.caption || "Fit"}
                          className="w-full h-full object-cover"
                        />
                        {fit.is_instagram_url && (
                          <Badge className="absolute top-2 right-2 bg-purple-600">
                            Instagram
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    {fit.caption && (
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {fit.caption}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closet" className="mt-6">
            {!isConnected ? (
              <div className="text-center py-12">
                <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect to view closet</h3>
                <p className="text-muted-foreground mb-4">Connect with this user to see their closet items.</p>
                <FollowButton 
                  targetUserId={userId!}
                  targetUsername={profile?.display_name || profile?.myfits_email || "User"}
                  size="default"
                />
              </div>
            ) : closetItems.length === 0 ? (
              <div className="text-center py-12">
                <ShirtIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Empty closet</h3>
                <p className="text-muted-foreground">This user hasn't added any items to their closet yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterAndSortItems(closetItems).map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="p-0">
                      <div className="aspect-square relative">
                        <FallbackImage
                          src={getImageUrl(item)}
                          alt={item.product_name || "Closet item"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold line-clamp-2">
                          {item.product_name || "Untitled Item"}
                        </h3>
                        <Badge variant="secondary">{item.brand_name}</Badge>
                        <div className="flex flex-wrap gap-2">
                          {item.category && (
                            <Badge variant="outline">{item.category}</Badge>
                          )}
                          {item.color && (
                            <Badge variant="outline">{item.color}</Badge>
                          )}
                          {item.size && (
                            <Badge variant="outline">Size {item.size}</Badge>
                          )}
                        </div>
                        {item.price && (
                          <p className="text-lg font-bold text-primary">{item.price}</p>
                        )}
                        {item.product_description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.product_description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes" className="mt-6">
            {!isConnected ? (
              <div className="text-center py-12">
                <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect to view likes</h3>
                <p className="text-muted-foreground mb-4">Connect with this user to see their liked items.</p>
                <FollowButton 
                  targetUserId={userId!}
                  targetUsername={profile?.display_name || profile?.myfits_email || "User"}
                  size="default"
                />
              </div>
            ) : likes.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No likes yet</h3>
                <p className="text-muted-foreground">This user hasn't liked any items yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterAndSortItems(likes).map((like) => (
                  <Card key={like.id} className="overflow-hidden">
                    <CardHeader className="p-0">
                      <div className="aspect-square relative">
                        <FallbackImage
                          src={getImageUrl(like)}
                          alt={like.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold line-clamp-2">{like.title}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="shrink-0"
                          >
                            <a
                              href={like.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                        {like.brand_name && (
                          <Badge variant="secondary">{like.brand_name}</Badge>
                        )}
                        {like.price && (
                          <p className="text-lg font-bold text-primary">{like.price}</p>
                        )}
                        {like.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {like.description}
                          </p>
                        )}
                        {like.category && (
                          <Badge variant="outline">{like.category}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="brands" className="mt-6">
            {!isConnected ? (
              <div className="text-center py-12">
                <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect to view brands</h3>
                <p className="text-muted-foreground mb-4">Connect with this user to see their favorite brands.</p>
                <FollowButton 
                  targetUserId={userId!}
                  targetUsername={profile?.display_name || profile?.myfits_email || "User"}
                  size="default"
                />
              </div>
            ) : brands.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No brands yet</h3>
                <p className="text-muted-foreground">This user hasn't interacted with any brands yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterAndSortBrands(brands).map((brand) => (
                  <Card key={brand.brand_name} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{brand.brand_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {brand.count} item{brand.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {brand.count}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ConnectionProfile;