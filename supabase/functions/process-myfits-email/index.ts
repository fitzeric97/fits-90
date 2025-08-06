import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface IncomingEmail {
  to: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing incoming @myfits.co email...');
    
    const emailData: IncomingEmail = await req.json();
    console.log('Email received:', { to: emailData.to, from: emailData.from, subject: emailData.subject });

    // Extract @myfits.co email to find user
    const myfitsEmail = emailData.to;
    if (!myfitsEmail.includes('@myfits.co')) {
      throw new Error('Not a @myfits.co email');
    }

    // Find user by their @myfits.co email
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('myfits_email', myfitsEmail)
      .single();

    if (userError || !userProfile) {
      console.error('User not found for email:', myfitsEmail);
      throw new Error('User not found');
    }

    console.log('Found user:', userProfile.id);

    // Determine email category and route accordingly
    const emailCategory = categorizeIncomingEmail(emailData);
    console.log('Email categorized as:', emailCategory);

    switch (emailCategory) {
      case 'order_confirmation':
        await processOrderEmail(userProfile.id, emailData);
        break;
      case 'promotion':
        await processPromotionalEmail(userProfile.id, emailData);
        break;
      case 'likes':
        await processLikesEmail(userProfile.id, emailData);
        break;
      default:
        await processPromotionalEmail(userProfile.id, emailData); // Default to promotional
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email processed as ${emailCategory}`,
        userId: userProfile.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Email processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process @myfits.co email'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function categorizeIncomingEmail(email: IncomingEmail): string {
  const subject = email.subject.toLowerCase();
  const text = (email.text || '').toLowerCase();
  const html = (email.html || '').toLowerCase();
  const content = `${subject} ${text} ${html}`;

  // Check for order confirmation keywords
  const orderKeywords = [
    'order', 'purchase', 'receipt', 'confirmation', 'shipped', 'tracking',
    'invoice', 'payment', 'checkout', 'transaction', 'order #', 'order number'
  ];
  
  if (orderKeywords.some(keyword => content.includes(keyword))) {
    return 'order_confirmation';
  }

  // Check for URLs/links (potential Likes)
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const hasUrls = urlPattern.test(content);
  
  // If it's a short email with URLs and no clear promotional content, treat as likes
  if (hasUrls && content.length < 500 && !content.includes('unsubscribe')) {
    return 'likes';
  }

  // Default to promotional
  return 'promotion';
}

async function processOrderEmail(userId: string, email: IncomingEmail) {
  console.log('Processing order confirmation email for user:', userId);
  
  // Extract brand name from sender email
  const senderDomain = email.from.split('@')[1];
  const brandName = extractBrandNameFromDomain(senderDomain);
  
  // Insert into promotional_emails table (order confirmations go here too)
  const { data: insertedEmail, error: insertError } = await supabase
    .from('promotional_emails')
    .insert({
      user_id: userId,
      gmail_message_id: `myfits-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender_email: email.from,
      sender_name: extractSenderName(email.from),
      brand_name: brandName,
      subject: email.subject,
      snippet: email.text?.substring(0, 300) || '',
      body_html: email.html || '',
      body_text: email.text || '',
      received_date: new Date().toISOString(),
      email_category: 'order_confirmation',
      email_source: 'myfits_email',
      order_number: extractOrderNumber(email.subject + ' ' + email.text),
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to insert order email:', insertError);
    throw insertError;
  }

  // Extract products to closet
  if (email.html) {
    try {
      await extractProductsToCloset(userId, insertedEmail.id, brandName, email.html, email.text || '');
    } catch (error) {
      console.error('Error extracting products to closet:', error);
    }
  }
}

async function processPromotionalEmail(userId: string, email: IncomingEmail) {
  console.log('Processing promotional email for user:', userId);
  
  const senderDomain = email.from.split('@')[1];
  const brandName = extractBrandNameFromDomain(senderDomain);
  
  const { error: insertError } = await supabase
    .from('promotional_emails')
    .insert({
      user_id: userId,
      gmail_message_id: `myfits-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender_email: email.from,
      sender_name: extractSenderName(email.from),
      brand_name: brandName,
      subject: email.subject,
      snippet: email.text?.substring(0, 300) || '',
      body_html: email.html || '',
      body_text: email.text || '',
      received_date: new Date().toISOString(),
      email_category: 'promotion',
      email_source: 'myfits_email',
    });

  if (insertError) {
    console.error('Failed to insert promotional email:', insertError);
    throw insertError;
  }
}

async function processLikesEmail(userId: string, email: IncomingEmail) {
  console.log('Processing likes email for user:', userId);
  
  // Extract URLs from email content
  const content = `${email.subject} ${email.text} ${email.html}`;
  const urlPattern = /https?:\/\/[^\s<>"]+/gi;
  const urls = content.match(urlPattern) || [];
  
  for (const url of urls) {
    try {
      // Add to likes table (we'll create this)
      const { error: likesError } = await supabase
        .from('user_likes')
        .insert({
          user_id: userId,
          url: url,
          title: email.subject || 'Liked Item',
          source_email: email.from,
          created_at: new Date().toISOString(),
        });

      if (likesError) {
        console.error('Failed to insert like:', likesError);
      }
    } catch (error) {
      console.error('Error processing like URL:', url, error);
    }
  }
}

function extractBrandNameFromDomain(domain: string): string {
  const domainParts = domain.split('.');
  const mainDomain = domainParts[domainParts.length - 2];
  return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
}

function extractSenderName(fromField: string): string {
  const match = fromField.match(/^([^<]+)</);
  return match ? match[1].trim().replace(/"/g, '') : fromField;
}

function extractOrderNumber(text: string): string | null {
  const orderMatch = text.match(/order\s*#?\s*([a-zA-Z0-9-]+)/i);
  return orderMatch ? orderMatch[1] : null;
}

// Simplified product extraction for @myfits.co emails
async function extractProductsToCloset(userId: string, emailId: string, brandName: string, bodyHtml: string, bodyText: string) {
  console.log('Extracting products to closet from @myfits.co email');
  
  // Basic product extraction logic
  const productPattern = /([A-Z\s&'-]+)\s*×?\s*(\d+)?/g;
  const matches = bodyText.match(productPattern);
  
  if (matches) {
    for (const match of matches.slice(0, 5)) { // Limit to 5 products
      const cleanMatch = match.trim();
      if (cleanMatch.length > 3 && cleanMatch.length < 100) {
        try {
          await supabase
            .from('closet_items')
            .insert({
              user_id: userId,
              email_id: emailId,
              brand_name: brandName,
              product_name: cleanMatch,
              product_description: cleanMatch,
              purchase_date: new Date().toISOString(),
              category: 'clothing', // Default category
            });
        } catch (error) {
          console.error('Error inserting closet item:', error);
        }
      }
    }
  }
}

serve(handler);