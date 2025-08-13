import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailNotificationRequest {
  user_id: string;
  notification_type: string;
  title: string;
  description?: string;
  data?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, notification_type, title, description, data }: EmailNotificationRequest = await req.json();

    console.log(`Processing email notification for user: ${user_id}, type: ${notification_type}`);

    // Check if user has email notifications enabled for this type
    const { data: preference, error: prefError } = await supabaseClient
      .from('notification_preferences')
      .select('email_enabled')
      .eq('user_id', user_id)
      .eq('notification_type', notification_type)
      .single();

    if (prefError) {
      console.error('Error fetching user preferences:', prefError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user preferences' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If email notifications are not enabled for this type, skip sending
    if (!preference?.email_enabled) {
      console.log(`Email notifications disabled for user ${user_id}, type: ${notification_type}`);
      return new Response(
        JSON.stringify({ message: 'Email notifications disabled for this type' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user profile for email address and display name
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('display_name, gmail_address')
      .eq('id', user_id)
      .single();

    if (profileError || !profile?.gmail_address) {
      console.error('Error fetching user profile or no email address:', profileError);
      return new Response(
        JSON.stringify({ error: 'User email address not found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare email content
    const emailSubject = `Fits - ${title}`;
    const emailBody = generateEmailHTML(title, description, notification_type, data, profile.display_name);

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fits <notifications@fits.app>',
        to: [profile.gmail_address],
        subject: emailSubject,
        html: emailBody,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Failed to send email:', emailResult);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: emailResult }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Email sent successfully to ${profile.gmail_address}:`, emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification sent successfully',
        email_id: emailResult.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-email-notification function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generateEmailHTML(title: string, description?: string, type?: string, data?: any, displayName?: string): string {
  const greeting = displayName ? `Hi ${displayName}` : 'Hi there';
  
  let actionSection = '';
  if (data) {
    switch (type) {
      case 'closet':
        actionSection = `
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666;">
              ${data.brand_name ? `Brand: ${data.brand_name}` : ''}
            </p>
          </div>
        `;
        break;
      case 'promotion':
        actionSection = `
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666;">
              ${data.brand_name ? `From: ${data.brand_name}` : ''}
            </p>
          </div>
        `;
        break;
      case 'likes':
        actionSection = `
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666;">
              ${data.url ? `<a href="${data.url}" style="color: #007bff; text-decoration: none;">View Item</a>` : ''}
            </p>
          </div>
        `;
        break;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Fits</h1>
        <p style="color: #666; margin: 5px 0 0 0;">Your Fashion Assistant</p>
      </div>
      
      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin-top: 0;">${greeting}!</h2>
        
        <h3 style="color: #374151; margin-bottom: 10px;">${title}</h3>
        
        ${description ? `<p style="color: #6b7280; margin-bottom: 20px;">${description}</p>` : ''}
        
        ${actionSection}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="https://fits.app/notifications" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
            View in Fits App
          </a>
        </div>
      </div>
      
      <div style="text-align: center; color: #6b7280; font-size: 14px;">
        <p>You're receiving this email because you have email notifications enabled for ${type || 'general'} updates.</p>
        <p>
          <a href="https://fits.app/notifications/settings" style="color: #2563eb; text-decoration: none;">
            Manage your notification preferences
          </a>
        </p>
      </div>
    </body>
    </html>
  `;
}