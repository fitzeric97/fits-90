import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userProfile, step } = await req.json();

    const systemPrompt = `You are a friendly, enthusiastic fashion expert helping new users learn the Fits app. 

Fits is a fashion organization app that helps users:
- Get a personal @myfits.co email for brand newsletters
- Automatically organize promotional emails  
- Build a digital closet of their clothing items
- Track likes and wishlist items
- Create and share outfit "fits"
- Connect with other fashion enthusiasts
- Discover brand promotions and deals

Create engaging, personalized onboarding content that's:
- Warm and welcoming
- Easy to understand
- Focused on the user's fashion journey
- Encouraging them to take action
- Brief but informative (2-3 sentences max)

User context: ${userProfile?.display_name ? `User's name is ${userProfile.display_name}` : 'New user'}`;

    const stepPrompts = {
      welcome: "Create a warm welcome message introducing Fits as their new fashion companion.",
      email: "Explain how their personal @myfits.co email will keep their inbox clean while they discover new brands.",
      closet: "Introduce the digital closet feature and how it helps organize their wardrobe.",
      fits: "Explain how they can create and share outfit combinations ('fits') with the community.",
      likes: "Describe how they can save and organize items they love from any website.",
      connect: "Introduce the social features and how they can connect with other fashion enthusiasts.",
      promotions: "Explain how Fits automatically finds and organizes brand deals and promotions for them.",
      ready: "Create an encouraging message that they're ready to start their fashion journey with Fits."
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: stepPrompts[step] || stepPrompts.welcome }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-onboarding function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});