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

    // Search for promotional emails first
    console.log('Scanning promotional emails...');
    const promoQuery = 'category:promotions OR from:(noreply OR marketing OR deals OR offers OR newsletter)';
    
    const promoResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(promoQuery)}&maxResults=${Math.floor(maxResults / 2)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!promoResponse.ok) {
      throw new Error(`Gmail API error: ${await promoResponse.text()}`);
    }

    const promoResults = await promoResponse.json();
    console.log(`Found ${promoResults.messages?.length || 0} promotional emails`);

    // Process promotional emails
    const processedEmails = [];
    
    if (promoResults.messages) {
      for (const message of promoResults.messages.slice(0, Math.floor(maxResults / 2))) {
        try {
          const emailData = await processEmail(message.id, accessToken, userId, 'promotional');
          if (emailData) {
            processedEmails.push(emailData);
          }
        } catch (error) {
          console.error(`Error processing promotional email ${message.id}:`, error);
        }
      }
    }

    // Get list of known fashion brands to search inbox
    console.log('Scanning main inbox for fashion brand emails...');
    
    const { data: existingBrands } = await supabase
      .from('promotional_emails')
      .select('brand_name')
      .eq('user_id', userId);
      
    const uniqueBrands = [...new Set(existingBrands?.map(e => e.brand_name) || [])];
    
    // Include major fashion brands in case user doesn't have any promotions yet
    const majorFashionBrands = [
      'Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Gap', 'Everlane', 'Patagonia',
      'North Face', 'Levi', 'Calvin Klein', 'Ralph Lauren'
    ];
    
    const allBrands = [...new Set([...uniqueBrands, ...majorFashionBrands])];
    
    // Search inbox for emails from fashion brands (limit to avoid API quota)
    for (const brand of allBrands.slice(0, 8)) {
      try {
        const brandQuery = `from:${brand.toLowerCase().replace(/[^a-z0-9]/g, '')} OR from:"${brand}"`;
        
        const inboxResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(brandQuery)}&maxResults=10`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (inboxResponse.ok) {
          const inboxData = await inboxResponse.json();
          const inboxMessages = inboxData.messages || [];
          
          console.log(`Found ${inboxMessages.length} inbox emails from ${brand}`);
          
          for (const message of inboxMessages) {
            try {
              const emailData = await processEmail(message.id, accessToken, userId, 'inbox');
              if (emailData) {
                processedEmails.push(emailData);
              }
            } catch (error) {
              console.error(`Error processing inbox email ${message.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error searching for brand ${brand}:`, error);
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

async function processEmail(messageId: string, accessToken: string, userId: string, emailSource: string = 'promotional') {
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

  // Extract brand name
  const brandName = extractBrandName(senderEmail, senderName, subject);
  
  // Check if this is a fashion/clothing related email
  const isFashionEmail = isFashionRelated(subject, email.snippet || '', senderEmail, brandName);
  
  if (!isFashionEmail) {
    console.log(`Skipping non-fashion email from ${brandName}: ${subject}`);
    return null;
  }
  
  // Check if user has unsubscribed from this brand
  const { data: unsubscribedData } = await supabase
    .from('unsubscribed_brands')
    .select('id')
    .eq('user_id', userId)
    .eq('brand_name', brandName)
    .single();
    
  if (unsubscribedData) {
    console.log(`Skipping unsubscribed brand ${brandName}: ${subject}`);
    return null;
  }
  
  // Categorize the email
  const emailCategory = categorizeEmail(subject, email.snippet || '');
  const { orderNumber, orderTotal, orderItems } = extractOrderInfo(subject, email.snippet || '');
  
  console.log(`Processing ${emailCategory} email from ${brandName}: ${subject}`);
  
  // Parse received date
  const receivedDate = new Date(parseInt(email.internalDate)).toISOString();

  // Extract expiration date (mainly for promotions)
  const expiresAt = emailCategory === 'promotion' ? extractExpirationDate(subject, email.snippet || '') : null;

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

  // Get full email body for order confirmations to extract product details
  let bodyHtml = '';
  let bodyText = '';
  
  if (email.payload) {
    const { html, text } = extractEmailBody(email.payload);
    bodyHtml = html;
    bodyText = text;
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
      body_html: bodyHtml,
      body_text: bodyText,
      received_date: receivedDate,
      expires_at: expiresAt,
      is_expired: expiresAt ? new Date(expiresAt) < new Date() : false,
      labels: email.labelIds || [],
      thread_id: email.threadId,
      email_category: emailCategory,
      email_source: emailSource,
      order_number: orderNumber,
      order_total: orderTotal,
      order_items: orderItems,
    })
    .select()
    .single();

  if (insertError) {
    console.error(`Failed to insert email ${messageId}:`, insertError);
    return null;
  }

  // If this is an order confirmation, try to extract product information for closet
  if (emailCategory === 'order_confirmation' && bodyHtml) {
    try {
      await extractProductsToCloset(userId, insertedEmail.id, brandName, bodyHtml, bodyText, orderNumber, receivedDate);
    } catch (error) {
      console.error('Error extracting products to closet:', error);
      // Don't fail the entire email processing if closet extraction fails
    }
  }

  return insertedEmail;
}

function extractBrandName(senderEmail: string, senderName: string, subject: string): string {
  // Extract domain-based brand name
  const domain = senderEmail.split('@')[1];
  
  if (domain) {
    // Fashion and clothing brands
    const fashionBrands = {
      'nike.com': 'Nike',
      'adidas.com': 'Adidas',
      'zara.com': 'Zara',
      'hm.com': 'H&M',
      'uniqlo.com': 'Uniqlo',
      'gap.com': 'Gap',
      'oldnavy.com': 'Old Navy',
      'bananarepublic.com': 'Banana Republic',
      'jcrew.com': 'J.Crew',
      'everlane.com': 'Everlane',
      'patagonia.com': 'Patagonia',
      'llbean.com': 'LL Bean',
      'northface.com': 'The North Face',
      'levi.com': 'Levi\'s',
      'calvinklein.com': 'Calvin Klein',
      'tommyhilfiger.com': 'Tommy Hilfiger',
      'ralphlauren.com': 'Ralph Lauren',
      'gucci.com': 'Gucci',
      'prada.com': 'Prada',
      'versace.com': 'Versace',
      'burberry.com': 'Burberry',
      'coach.com': 'Coach',
      'katespade.com': 'Kate Spade',
      'michaelkors.com': 'Michael Kors',
      'marcjacobs.com': 'Marc Jacobs',
      'rayban.com': 'Ray-Ban',
      'oakley.com': 'Oakley',
      'warbyparker.com': 'Warby Parker',
      'allbirds.com': 'Allbirds',
      'vans.com': 'Vans',
      'converse.com': 'Converse',
      'newbalance.com': 'New Balance',
      'reebok.com': 'Reebok',
      'underarmour.com': 'Under Armour',
      'lululemon.com': 'Lululemon',
      'athleta.com': 'Athleta',
      'fabletics.com': 'Fabletics',
      'asos.com': 'ASOS',
      'boohoo.com': 'Boohoo',
      'prettylittlething.com': 'PrettyLittleThing',
      'fashionnova.com': 'Fashion Nova',
      'shein.com': 'SHEIN',
      'urbanoutfitters.com': 'Urban Outfitters',
      'freepeople.com': 'Free People',
      'anthropologie.com': 'Anthropologie',
      'nordstrom.com': 'Nordstrom',
      'saksfifthavenue.com': 'Saks Fifth Avenue',
      'neimanmarcus.com': 'Neiman Marcus',
      'bergdorfgoodman.com': 'Bergdorf Goodman',
      'ssense.com': 'SSENSE',
      'farfetch.com': 'Farfetch',
      'netaporter.com': 'Net-A-Porter',
      'matchesfashion.com': 'Matches Fashion',
      'revolve.com': 'Revolve',
      'shopbop.com': 'Shopbop',
      'theoutnet.com': 'The Outnet',
      'gilt.com': 'Gilt',
      'ruelala.com': 'Rue La La',
      'hautelook.com': 'HauteLook',
      'target.com': 'Target',
      'walmart.com': 'Walmart',
      'amazon.com': 'Amazon',
      'costco.com': 'Costco',
      'macys.com': 'Macy\'s',
      'dillards.com': 'Dillard\'s',
      'kohls.com': 'Kohl\'s',
      'jcpenney.com': 'JCPenney',
      'tjmaxx.com': 'TJ Maxx',
      'marshalls.com': 'Marshalls',
      'nordstromrack.com': 'Nordstrom Rack',
      'saksfifthavenue.com': 'Saks OFF 5TH',
    };
    
    for (const [domainPattern, brand] of Object.entries(fashionBrands)) {
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

// New function to check if email is fashion/clothing related
function isFashionRelated(subject: string, snippet: string, senderEmail: string, brandName: string): boolean {
  const text = `${subject} ${snippet}`.toLowerCase();
  const domain = senderEmail.split('@')[1]?.toLowerCase();
  const email = senderEmail.toLowerCase();
  
  // EXCLUSION FILTERS - Immediately exclude these categories
  const exclusionKeywords = [
    // Healthcare & Medical
    'patient', 'medical', 'health', 'doctor', 'appointment', 'prescription', 'pharmacy',
    'hospital', 'clinic', 'dental', 'insurance', 'medicare', 'medicaid',
    
    // Entertainment & Streaming
    'netflix', 'prime video', 'primevideo', 'hulu', 'disney+', 'spotify', 'youtube',
    'streaming', 'movie', 'show', 'series', 'episode', 'season',
    
    // Government & Services
    'toll', 'traffic', 'parking', 'citation', 'violation', 'court', 'jury',
    'government', 'tax', 'irs', 'dmv', 'license', 'registration', 'permit',
    'hctra', 'municipal', 'county', 'state', 'federal',
    
    // Sports & Recreation (non-apparel)
    'hockey', 'football', 'baseball', 'basketball', 'soccer', 'game', 'season',
    'ticket', 'schedule', 'score', 'league', 'team', 'match', 'tournament',
    'fantasy', 'draft', 'playoff', 'championship',
    
    // Technology & Software
    'software', 'app', 'download', 'update', 'security', 'password', 'login',
    'account', 'verification', 'confirm', 'reset', 'backup',
    
    // Finance & Banking
    'bank', 'credit', 'loan', 'mortgage', 'investment', 'portfolio', 'statement',
    'payment', 'bill', 'invoice', 'receipt', 'transaction',
    
    // Travel & Transportation
    'flight', 'airline', 'hotel', 'booking', 'reservation', 'itinerary',
    'uber', 'lyft', 'taxi', 'car rental',
    
    // Food & Restaurants
    'restaurant', 'delivery', 'doordash', 'grubhub', 'ubereats', 'menu',
    'food', 'dining', 'takeout', 'pizza', 'coffee',
    
    // Education & Work
    'course', 'training', 'webinar', 'conference', 'meeting', 'interview',
    'job', 'career', 'resume', 'linkedin',
    
    // Utilities & Services
    'electricity', 'gas', 'water', 'internet', 'cable', 'phone', 'utility',
    'repair', 'maintenance', 'service call'
  ];
  
  // Check for exclusion keywords
  const hasExclusionKeywords = exclusionKeywords.some(keyword => 
    text.includes(keyword) || email.includes(keyword) || brandName.toLowerCase().includes(keyword)
  );
  
  if (hasExclusionKeywords) {
    return false;
  }
  
  // Exclude specific domains that are definitely not fashion
  const excludedDomains = [
    'primevideo', 'netflix', 'hulu', 'spotify', 'youtube',
    'hctra', 'tolltag', 'ezpass', 'fastrak',
    'usahockey', 'nhl', 'nfl', 'nba', 'mlb', 'espn',
    'hospital', 'clinic', 'medical', 'health',
    'bank', 'chase', 'wellsfargo', 'bofa', 'citi',
    'amazon.aws', 'google.com', 'microsoft', 'apple.com',
    'uber', 'lyft', 'doordash', 'grubhub'
  ];
  
  const hasExcludedDomain = domain && excludedDomains.some(excluded => domain.includes(excluded));
  
  if (hasExcludedDomain) {
    return false;
  }
  
  // NOW check for fashion-specific keywords (must be present)
  const fashionKeywords = [
    // Clothing categories
    'clothing', 'apparel', 'fashion', 'style', 'outfit', 'wardrobe',
    'shirt', 'dress', 'pants', 'jeans', 'skirt', 'shorts', 'top', 'blouse',
    'jacket', 'coat', 'sweater', 'hoodie', 'cardigan', 'blazer',
    'lingerie', 'underwear', 'bra', 'panties', 'sleepwear', 'pajamas',
    'swimwear', 'bikini', 'swimsuit', 'bathing suit',
    
    // Footwear
    'shoes', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers',
    'athletic shoes', 'running shoes', 'dress shoes', 'casual shoes',
    
    // Accessories
    'accessories', 'jewelry', 'necklace', 'bracelet', 'earrings', 'ring',
    'watch', 'bag', 'purse', 'handbag', 'backpack', 'wallet', 'clutch',
    'belt', 'scarf', 'hat', 'cap', 'sunglasses', 'glasses', 'tie',
    'gloves', 'socks', 'stockings', 'tights',
    
    // Fashion terms
    'collection', 'new arrivals', 'seasonal', 'trends', 'designer',
    'couture', 'runway', 'lookbook', 'styling', 'fit', 'size',
    
    // Sales terms specific to fashion
    'wardrobe refresh', 'closet cleanout', 'seasonal sale', 'end of season',
    'new season', 'spring collection', 'summer styles', 'fall fashion',
    'winter wear', 'holiday outfits', 'back to school',
    
    // Brand-specific terms
    'activewear', 'athleisure', 'sportswear', 'formal wear', 'casual wear',
    'business attire', 'evening wear', 'cocktail dress', 'little black dress'
  ];
  
  // Check if any fashion keywords are present
  const hasFashionKeywords = fashionKeywords.some(keyword => text.includes(keyword));
  
  // Check if it's from a known fashion domain
  const fashionDomains = [
    'fashion', 'style', 'clothing', 'apparel', 'shoes', 'accessories',
    'jewelry', 'bags', 'sunglasses', 'watches', 'boutique', 'closet'
  ];
  
  const hasFashionDomain = domain && fashionDomains.some(keyword => domain.includes(keyword));
  
  // Check if brand name suggests fashion
  const fashionBrandKeywords = ['fashion', 'style', 'clothing', 'apparel', 'boutique'];
  const hasFashionBrand = fashionBrandKeywords.some(keyword => brandName.toLowerCase().includes(keyword));
  
  // More restrictive: require either fashion keywords OR fashion domain/brand
  return hasFashionKeywords || hasFashionDomain || hasFashionBrand;
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

// Function to categorize emails as promotion, order confirmation, etc.
function categorizeEmail(subject: string, snippet: string): string {
  const text = `${subject} ${snippet}`.toLowerCase();
  
  // Order confirmation patterns
  const orderPatterns = [
    'order confirmation', 'order receipt', 'order confirmed', 'purchase confirmation',
    'your order', 'order #', 'order number', 'order placed', 'order received',
    'thank you for your order', 'order details', 'order summary',
    'payment confirmation', 'purchase receipt', 'invoice',
    'order complete', 'order status', 'order update'
  ];
  
  // Shipping patterns
  const shippingPatterns = [
    'shipped', 'tracking', 'shipment', 'delivery', 'package',
    'on its way', 'in transit', 'dispatched', 'sent',
    'tracking number', 'tracking info', 'delivery update',
    'package status', 'shipping confirmation'
  ];
  
  // Promotion patterns (default)
  const promotionPatterns = [
    'sale', 'discount', 'off', 'deal', 'offer', 'promo', 'coupon',
    'save', 'special', 'limited time', 'flash sale', 'clearance',
    'percent off', '% off', 'free shipping', 'black friday',
    'cyber monday', 'new arrivals', 'collection'
  ];
  
  // Check for order confirmation
  if (orderPatterns.some(pattern => text.includes(pattern))) {
    return 'order_confirmation';
  }
  
  // Check for shipping
  if (shippingPatterns.some(pattern => text.includes(pattern))) {
    return 'shipping';
  }
  
  // Check for promotion
  if (promotionPatterns.some(pattern => text.includes(pattern))) {
    return 'promotion';
  }
  
  // Default to other if no clear category
  return 'other';
}

// Function to extract order information from order confirmation emails
function extractOrderInfo(subject: string, snippet: string): { orderNumber: string | null, orderTotal: string | null, orderItems: string | null } {
  const text = `${subject} ${snippet}`;
  
  let orderNumber = null;
  let orderTotal = null;
  let orderItems = null;
  
  // Extract order number
  const orderNumberPatterns = [
    /order\s*#\s*([A-Z0-9\-]+)/i,
    /order\s+number\s*:?\s*([A-Z0-9\-]+)/i,
    /confirmation\s+#\s*([A-Z0-9\-]+)/i,
    /order\s+([A-Z0-9\-]{6,})/i
  ];
  
  for (const pattern of orderNumberPatterns) {
    const match = text.match(pattern);
    if (match) {
      orderNumber = match[1];
      break;
    }
  }
  
  // Extract order total
  const totalPatterns = [
    /total\s*:?\s*\$?([\d,]+\.?\d*)/i,
    /amount\s*:?\s*\$?([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.?\d*)\s*total/i,
    /charged\s*\$?([\d,]+\.?\d*)/i
  ];
  
  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      orderTotal = `$${match[1]}`;
      break;
    }
  }
  
  // Extract basic item information (this is simplified)
  const itemPatterns = [
    /(\d+)\s+item/i,
    /(\d+)\s+product/i
  ];
  
  for (const pattern of itemPatterns) {
    const match = text.match(pattern);
    if (match) {
      orderItems = `${match[1]} items`;
      break;
    }
  }
  
  return { orderNumber, orderTotal, orderItems };
}

// Function to extract email body content (HTML and text)
function extractEmailBody(payload: any): { html: string, text: string } {
  let html = '';
  let text = '';
  
  function extractFromPayload(part: any) {
    if (part.body && part.body.data) {
      const data = part.body.data.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(data);
      
      if (part.mimeType === 'text/html') {
        html += decoded;
      } else if (part.mimeType === 'text/plain') {
        text += decoded;
      }
    }
    
    if (part.parts) {
      part.parts.forEach((subPart: any) => extractFromPayload(subPart));
    }
  }
  
  extractFromPayload(payload);
  return { html, text };
}

// Function to extract product information and add to closet
async function extractProductsToCloset(
  userId: string, 
  emailId: string, 
  brandName: string, 
  bodyHtml: string, 
  bodyText: string, 
  orderNumber: string | null, 
  purchaseDate: string
) {
  console.log(`Extracting products from order confirmation for ${brandName}`);
  
  // Extract product images from HTML
  const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const images: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(bodyHtml)) !== null) {
    const imageUrl = match[1];
    // Filter for product images (avoid logos, icons, tracking pixels)
    if (imageUrl && 
        !imageUrl.includes('logo') && 
        !imageUrl.includes('icon') && 
        !imageUrl.includes('pixel') &&
        !imageUrl.includes('tracking') &&
        !imageUrl.includes('1x1') &&
        imageUrl.includes('http') &&
        (imageUrl.includes('product') || imageUrl.includes('item') || imageUrl.width > 100)) {
      images.push(imageUrl);
    }
  }
  
  // Extract product names and descriptions
  const productInfo = extractProductDetails(bodyHtml, bodyText, brandName);
  
  // Extract company website URL
  const websiteUrl = extractWebsiteUrl(bodyHtml, brandName);
  
  // For each product found, create a closet item
  for (let i = 0; i < Math.max(1, images.length); i++) {
    const productImage = images[i] || null;
    const product = productInfo[i] || productInfo[0] || {};
    
    try {
      const { error } = await supabase
        .from('closet_items')
        .insert({
          user_id: userId,
          email_id: emailId,
          brand_name: brandName,
          product_name: product.name || `${brandName} Item`,
          product_description: product.description || 'Fashion item from order confirmation',
          product_image_url: productImage,
          company_website_url: websiteUrl,
          purchase_date: purchaseDate,
          order_number: orderNumber,
          price: product.price || null,
          size: product.size || null,
          color: product.color || null,
          category: categorizeProduct(product.name || '', product.description || ''),
        });
        
      if (error) {
        console.error('Error inserting closet item:', error);
      } else {
        console.log(`Added ${product.name || 'item'} to closet for ${brandName}`);
      }
    } catch (error) {
      console.error('Error processing closet item:', error);
    }
  }
}

// Function to extract product details from email content
function extractProductDetails(bodyHtml: string, bodyText: string, brandName: string): Array<{name?: string, description?: string, price?: string, size?: string, color?: string}> {
  const products: Array<{name?: string, description?: string, price?: string, size?: string, color?: string}> = [];
  
  // Look for product tables or sections in HTML
  const productSections = bodyHtml.split(/(?=<tr|<div[^>]*product|<div[^>]*item)/i);
  
  for (const section of productSections.slice(0, 5)) { // Limit to 5 products
    const product: {name?: string, description?: string, price?: string, size?: string, color?: string} = {};
    
    // Extract product name
    const nameMatch = section.match(/<(?:td|div|h[1-6])[^>]*>([^<]*(?:shirt|dress|pants|jeans|shoes|bag|jacket|coat|sweater|hoodie|top|skirt|shorts|boots|sneakers|sandals|belt|scarf|hat|watch|jewelry|necklace|bracelet|ring|earrings)[^<]*)<\/(?:td|div|h[1-6])>/i);
    if (nameMatch) {
      product.name = nameMatch[1].trim().replace(/\s+/g, ' ');
    }
    
    // Extract price
    const priceMatch = section.match(/\$\s*([\d,]+\.?\d*)/);
    if (priceMatch) {
      product.price = `$${priceMatch[1]}`;
    }
    
    // Extract size
    const sizeMatch = section.match(/size:\s*([XS|S|M|L|XL|XXL|\d+|[\d.]+)/i);
    if (sizeMatch) {
      product.size = sizeMatch[1];
    }
    
    // Extract color
    const colorMatch = section.match(/color:\s*([a-zA-Z\s]+)/i);
    if (colorMatch) {
      product.color = colorMatch[1].trim();
    }
    
    if (product.name || product.price) {
      products.push(product);
    }
  }
  
  // If no products found in HTML, try to extract from text
  if (products.length === 0) {
    const textLines = bodyText.split('\n');
    for (const line of textLines) {
      if (line.toLowerCase().includes('item') || line.toLowerCase().includes('product')) {
        const product: {name?: string, description?: string, price?: string} = {};
        product.name = line.trim();
        const priceMatch = line.match(/\$\s*([\d,]+\.?\d*)/);
        if (priceMatch) {
          product.price = `$${priceMatch[1]}`;
        }
        products.push(product);
        if (products.length >= 3) break; // Limit to 3 products from text
      }
    }
  }
  
  return products.length > 0 ? products : [{ name: `${brandName} Item`, description: 'Fashion item from order confirmation' }];
}

// Function to extract company website URL
function extractWebsiteUrl(bodyHtml: string, brandName: string): string | null {
  // Look for links to the brand's website
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = linkRegex.exec(bodyHtml)) !== null) {
    const url = match[1];
    const domain = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (url && url.includes('http') && 
        (url.toLowerCase().includes(domain) || 
         url.toLowerCase().includes(brandName.toLowerCase().replace(/\s+/g, '')))) {
      return url;
    }
  }
  
  // Fallback: construct likely website URL
  const domain = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://www.${domain}.com`;
}

// Function to categorize products
function categorizeProduct(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();
  
  if (text.match(/shoe|sneaker|boot|sandal|heel|flat|loafer/)) {
    return 'shoes';
  }
  if (text.match(/bag|purse|handbag|backpack|clutch|wallet/)) {
    return 'accessories';
  }
  if (text.match(/jewelry|necklace|bracelet|ring|earring|watch/)) {
    return 'jewelry';
  }
  if (text.match(/dress|skirt|top|blouse|shirt|pants|jeans|shorts|jacket|coat|sweater|hoodie/)) {
    return 'clothing';
  }
  
  return 'other';
}

serve(handler);