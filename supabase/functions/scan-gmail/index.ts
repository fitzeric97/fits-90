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

interface ScanRequest {
  userId: string;
  maxResults?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, maxResults = 50 }: ScanRequest = await req.json();
    
    console.log('Starting Gmail scan for user:', userId);

    // Get user's Gmail tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_gmail_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Gmail not connected. Please connect your Gmail account first.');
    }

    // Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    let accessToken = tokenData.access_token;
    
    if (now >= expiresAt) {
      console.log('Refreshing expired token for user:', userId);
      accessToken = await refreshAccessToken(tokenData.refresh_token, userId);
    }

    // Search for promotional emails
    const query = 'category:promotions OR from:(noreply OR marketing OR deals OR offers OR newsletter)';
    
    const searchResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Gmail API error: ${await searchResponse.text()}`);
    }

    const searchResults = await searchResponse.json();
    console.log(`Found ${searchResults.messages?.length || 0} promotional emails`);

    if (!searchResults.messages) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No promotional emails found',
          processed: 0 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Process each email
    const processedEmails = [];
    
    for (const message of searchResults.messages.slice(0, maxResults)) {
      try {
        const emailData = await processEmail(message.id, accessToken, userId);
        if (emailData) {
          processedEmails.push(emailData);
        }
      } catch (error) {
        console.error(`Error processing email ${message.id}:`, error);
      }
    }

    console.log(`Successfully processed ${processedEmails.length} emails for user:`, userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedEmails.length} promotional emails`,
        processed: processedEmails.length,
        emails: processedEmails
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Gmail scan error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to scan Gmail'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function refreshAccessToken(refreshToken: string, userId: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const tokens = await response.json();
  
  // Update tokens in database
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  
  await supabase
    .from('user_gmail_tokens')
    .update({
      access_token: tokens.access_token,
      expires_at: expiresAt,
    })
    .eq('user_id', userId);

  return tokens.access_token;
}

async function processEmail(messageId: string, accessToken: string, userId: string) {
  // Get email details
  const emailResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!emailResponse.ok) {
    console.error(`Failed to fetch email ${messageId}`);
    return null;
  }

  const email = await emailResponse.json();
  
  // Extract email data
  const headers = email.payload.headers || [];
  const from = headers.find((h: any) => h.name === 'From')?.value || '';
  const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
  const date = headers.find((h: any) => h.name === 'Date')?.value || '';

  // Extract sender email and name
  const emailMatch = from.match(/<([^>]+)>/);
  const senderEmail = emailMatch ? emailMatch[1] : from;
  const senderName = emailMatch ? from.replace(emailMatch[0], '').trim().replace(/"/g, '') : senderEmail;

  // Extract brand name (simplified)
  const brandName = extractBrandName(senderEmail, senderName, subject);
  
  // Parse received date
  const receivedDate = new Date(parseInt(email.internalDate)).toISOString();

  // Extract expiration date (simplified pattern matching)
  const expiresAt = extractExpirationDate(subject, email.snippet || '');

  // Check if email already exists
  const { data: existingEmail } = await supabase
    .from('promotional_emails')
    .select('id')
    .eq('gmail_message_id', messageId)
    .eq('user_id', userId)
    .single();

  if (existingEmail) {
    console.log(`Email ${messageId} already exists, skipping`);
    return null;
  }

  // Insert email into database
  const { data: insertedEmail, error: insertError } = await supabase
    .from('promotional_emails')
    .insert({
      user_id: userId,
      gmail_message_id: messageId,
      sender_email: senderEmail,
      sender_name: senderName,
      brand_name: brandName,
      subject: subject,
      snippet: email.snippet || '',
      received_date: receivedDate,
      expires_at: expiresAt,
      is_expired: expiresAt ? new Date(expiresAt) < new Date() : false,
      labels: email.labelIds || [],
      thread_id: email.threadId,
    })
    .select()
    .single();

  if (insertError) {
    console.error(`Failed to insert email ${messageId}:`, insertError);
    return null;
  }

  return insertedEmail;
}

function extractBrandName(senderEmail: string, senderName: string, subject: string): string {
  // Extract domain-based brand name
  const domain = senderEmail.split('@')[1];
  
  if (domain) {
    // Common brand patterns
    const brandPatterns = [
      'nike.com' => 'Nike',
      'everlane.com' => 'Everlane',
      'uniqlo.com' => 'Uniqlo',
      'zara.com' => 'Zara',
      'llbean.com' => 'LL Bean',
      'patagonia.com' => 'Patagonia',
      'amazon.com' => 'Amazon',
      'target.com' => 'Target',
      'walmart.com' => 'Walmart',
    ];
    
    for (const [domainPattern, brand] of Object.entries(brandPatterns)) {
      if (domain.includes(domainPattern.replace('.com', ''))) {
        return brand;
      }
    }
    
    // Extract brand from domain
    const domainParts = domain.split('.');
    const mainDomain = domainParts[domainParts.length - 2];
    return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
  }
  
  // Fallback to sender name
  return senderName || 'Unknown Brand';
}

function extractExpirationDate(subject: string, snippet: string): string | null {
  const text = `${subject} ${snippet}`.toLowerCase();
  
  // Common expiration patterns
  const patterns = [
    /expires?\s+(?:on\s+)?(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /expires?\s+(?:on\s+)?(\d{1,2}-\d{1,2}-\d{2,4})/i,
    /valid\s+until\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /ends?\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /(\d{1,2})\s+days?\s+left/i,
    /(\d{1,2})\s+hours?\s+left/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1].includes('day')) {
        // Days left pattern
        const days = parseInt(match[1]);
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + days);
        return expireDate.toISOString();
      } else if (match[1].includes('hour')) {
        // Hours left pattern
        const hours = parseInt(match[1]);
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + hours);
        return expireDate.toISOString();
      } else {
        // Date pattern
        try {
          const expireDate = new Date(match[1]);
          if (!isNaN(expireDate.getTime())) {
            return expireDate.toISOString();
          }
        } catch (error) {
          console.log('Failed to parse date:', match[1]);
        }
      }
    }
  }
  
  return null;
}

serve(handler);