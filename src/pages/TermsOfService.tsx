import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/components/auth/AuthProvider";

export default function TermsOfService() {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const TermsContent = () => (
    <div className={`space-y-6 ${isMobile ? 'px-4 py-6' : 'max-w-4xl mx-auto'}`}>
      <div>
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acceptance of Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            By accessing and using our fashion organization platform ("Fits"), you accept and agree to be bound by the terms and 
            provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Fashion Organization Platform</h3>
            <p className="text-sm text-muted-foreground">
              Fits provides tools to organize your fashion items, track outfits, manage your digital closet, and discover promotional offers from fashion brands.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Third-Party Integrations</h3>
            <p className="text-sm text-muted-foreground">
              Our service integrates with Instagram and Gmail to enhance your fashion organization experience. These integrations are optional and require your explicit consent.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Content Management</h3>
            <p className="text-sm text-muted-foreground">
              You can upload, organize, and share fashion-related content through our platform, including photos, outfit descriptions, and product information.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Accounts and Responsibilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Account Creation</h3>
            <p className="text-sm text-muted-foreground">
              You must provide accurate and complete information when creating your account and keep your account information updated.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Account Security</h3>
            <p className="text-sm text-muted-foreground">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Acceptable Use</h3>
            <p className="text-sm text-muted-foreground">
              You agree to use our service only for lawful purposes and in accordance with these terms. You will not upload or share inappropriate, harmful, or copyrighted content.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content and Intellectual Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Your Content</h3>
            <p className="text-sm text-muted-foreground">
              You retain ownership of the content you upload to our platform. By uploading content, you grant us a license to store, display, and organize your content as part of our service.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Platform Content</h3>
            <p className="text-sm text-muted-foreground">
              Our platform, including its design, features, and functionality, is owned by us and protected by intellectual property laws.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Copyright Compliance</h3>
            <p className="text-sm text-muted-foreground">
              You must not upload content that infringes on others' intellectual property rights. We respond to valid copyright takedown requests in accordance with applicable law.
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
              When you connect your Instagram account, you agree to Instagram's terms of service and acknowledge that we are not responsible for Instagram's policies or actions.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Gmail Integration</h3>
            <p className="text-sm text-muted-foreground">
              Gmail integration is subject to Google's terms of service. We use this integration solely to help organize your fashion-related promotional emails.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">External Links</h3>
            <p className="text-sm text-muted-foreground">
              Our service may contain links to external websites and retailers. We are not responsible for the content, policies, or practices of these external sites.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Service Uptime</h3>
            <p className="text-sm text-muted-foreground">
              We strive to maintain high service availability but cannot guarantee uninterrupted access. We may perform maintenance or updates that temporarily affect service availability.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Service Modifications</h3>
            <p className="text-sm text-muted-foreground">
              We reserve the right to modify, suspend, or discontinue any aspect of our service with reasonable notice to users.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy and Data Protection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, 
            which is incorporated into these terms by reference.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Service Provided "As Is"</h3>
            <p className="text-sm text-muted-foreground">
              Our service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Limitation of Damages</h3>
            <p className="text-sm text-muted-foreground">
              To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Termination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Termination by You</h3>
            <p className="text-sm text-muted-foreground">
              You may terminate your account at any time by using the account deletion feature in your settings.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Termination by Us</h3>
            <p className="text-sm text-muted-foreground">
              We may suspend or terminate accounts that violate these terms or engage in harmful activities.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Effect of Termination</h3>
            <p className="text-sm text-muted-foreground">
              Upon termination, your access to the service will cease, and we may delete your account data in accordance with our data retention policies.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We may update these terms from time to time. We will notify you of significant changes through the app or by email. 
            Your continued use of our service after changes become effective constitutes acceptance of the updated terms.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Governing Law and Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            These terms are governed by applicable law. Any disputes arising from these terms or your use of our service will be resolved through 
            appropriate legal channels in accordance with applicable jurisdiction.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you have questions about these terms of service, please contact us through the app's support feature or reach out to our team.
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
          <TermsContent />
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileLayout>
        <TermsContent />
      </MobileLayout>
    );
  }

  return (
    <DashboardLayout>
      <TermsContent />
    </DashboardLayout>
  );
}