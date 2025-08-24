import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PrivacyPolicy() {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const PrivacyContent = () => (
    <div className={`space-y-6 ${isMobile ? 'px-4 py-6' : 'max-w-4xl mx-auto'}`}>
      <div>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Account Information</h3>
            <p className="text-sm text-muted-foreground">
              When you create an account, we collect your email address, name, and basic profile information to provide our services.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Fashion Content</h3>
            <p className="text-sm text-muted-foreground">
              We collect and store the fashion items, outfits, and preferences you share through our platform to personalize your experience.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Email Integration</h3>
            <p className="text-sm text-muted-foreground">
              With your consent, we access your Gmail account to scan for promotional emails from fashion brands to help organize your shopping deals.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Instagram Integration</h3>
            <p className="text-sm text-muted-foreground">
              When you connect your Instagram account, we access your photos and basic profile information to help import your fashion content.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Service Provision</h3>
            <p className="text-sm text-muted-foreground">
              We use your information to provide our fashion organization and discovery services, including outfit tracking, closet management, and promotion alerts.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Personalization</h3>
            <p className="text-sm text-muted-foreground">
              Your data helps us personalize your experience, recommend relevant fashion items, and organize promotions based on your preferences.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Communication</h3>
            <p className="text-sm text-muted-foreground">
              We may send you notifications about new promotions, app updates, and account-related information based on your notification preferences.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Information Sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">No Sale of Personal Data</h3>
            <p className="text-sm text-muted-foreground">
              We do not sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Service Providers</h3>
            <p className="text-sm text-muted-foreground">
              We may share information with trusted service providers who help us operate our platform, including cloud storage, analytics, and communication services.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Legal Requirements</h3>
            <p className="text-sm text-muted-foreground">
              We may disclose information when required by law or to protect our rights, safety, or the rights and safety of others.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Encryption & Protection</h3>
            <p className="text-sm text-muted-foreground">
              We use industry-standard encryption and security measures to protect your personal information and fashion data.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Access Controls</h3>
            <p className="text-sm text-muted-foreground">
              Access to your data is restricted to authorized personnel and systems necessary for providing our services.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Account Control</h3>
            <p className="text-sm text-muted-foreground">
              You can update, modify, or delete your account information at any time through your account settings.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Data Portability</h3>
            <p className="text-sm text-muted-foreground">
              You can request a copy of your data or ask us to delete your information by contacting our support team.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Integration Controls</h3>
            <p className="text-sm text-muted-foreground">
              You can disconnect third-party integrations (Gmail, Instagram) at any time through your settings.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Third-Party Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Instagram Integration</h3>
            <p className="text-sm text-muted-foreground">
              When you connect Instagram, you're subject to Instagram's terms of service and privacy policy in addition to ours.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Google Services</h3>
            <p className="text-sm text-muted-foreground">
              Gmail integration is subject to Google's privacy policy and terms of service.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">External Links</h3>
            <p className="text-sm text-muted-foreground">
              Our app may contain links to fashion retailers and other websites. We're not responsible for their privacy practices.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changes to This Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We may update this privacy policy from time to time. We will notify you of any significant changes through the app or by email. 
            Your continued use of our services after changes become effective constitutes acceptance of the updated policy.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you have questions about this privacy policy or how we handle your data, please contact us through the app's support feature 
            or reach out to our team.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Show public version if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <PrivacyContent />
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileLayout>
        <PrivacyContent />
      </MobileLayout>
    );
  }

  return (
    <DashboardLayout>
      <PrivacyContent />
    </DashboardLayout>
  );
}