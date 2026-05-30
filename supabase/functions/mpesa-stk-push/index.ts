import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, amount, applicationId, depositType } = await req.json();
    console.log('Paywave STK Push request:', { phoneNumber, amount, applicationId, depositType });

    if (!phoneNumber || !amount) {
      throw new Error('Missing required fields: phoneNumber or amount');
    }

    // Format phone for Paywave (accepts 07XX or 2547XX)
    let formattedPhone = String(phoneNumber).replace(/\D/g, '');
    if (formattedPhone.startsWith('254')) {
      // already in 254 format
    } else if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.length === 9) {
      formattedPhone = '254' + formattedPhone;
    }

    const apiKey = (Deno.env.get('PAYWAVE_API_KEY') ?? '').trim();
    const email = (Deno.env.get('PAYWAVE_EMAIL') ?? '').trim();
    const accountNumber = (Deno.env.get('PAYWAVE_ACCOUNT_NUMBER') ?? '').trim();

    if (!apiKey || !email) {
      throw new Error('Paywave credentials not configured');
    }

    // Unique reference (prefix lets the callback route correctly)
    const reference = depositType === 'savings'
      ? `savings_${Date.now()}_${Math.random().toString(36).substring(7)}`
      : `loan_${applicationId}_${Date.now()}`;

    const payload: Record<string, string> = {
      api_key: apiKey,
      email,
      amount: String(Math.floor(amount)),
      msisdn: formattedPhone,
      reference,
    };
    // Only include account_number if it looks like a real account (no spaces, URLs, etc.)
    if (accountNumber && /^[A-Za-z0-9._-]{1,30}$/.test(accountNumber)) {
      payload.account_number = accountNumber;
    }

    console.log('Paywave payload:', { ...payload, api_key: '***' });

    const pwResp = await fetch('https://paywavexpress.co.ke/v1/stkpush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const pwResult = await pwResp.json();
    console.log('Paywave response:', pwResult);

    if (!pwResp.ok || pwResult.ResponseCode !== '0') {
      throw new Error(pwResult.errorMessage || pwResult.message || 'Failed to initiate payment');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    if (depositType === 'savings' && userId) {
      await supabase.from('savings_deposits').insert({
        user_id: userId,
        amount: Math.floor(amount),
        mpesa_message: `STK Push initiated - Reference: ${reference}`,
        transaction_code: reference,
        verified: null, // pending — callback will set true/false
      });
    } else if (applicationId) {
      await supabase.from('loan_disbursements').insert({
        application_id: applicationId,
        loan_amount: amount,
        processing_fee: amount,
        transaction_code: reference,
        payment_verified: false,
        disbursed: false,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: pwResult.message || 'STK Push sent. Check your phone for the M-Pesa prompt.',
        reference,
        transaction_request_id: pwResult.transaction_request_id,
        displayText: 'Please enter your M-Pesa PIN when prompted',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in Paywave STK Push:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
