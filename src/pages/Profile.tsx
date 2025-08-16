import Settings from "./Settings";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileProfile from "@/components/mobile/MobileProfile";

export default function Profile() {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileProfile />;
  }
  
  return <Settings />;
}