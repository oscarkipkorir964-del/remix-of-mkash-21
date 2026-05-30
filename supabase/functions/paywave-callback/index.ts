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
    const payload = await req.json();
    console.log('Paywave callback received:', JSON.stringify(payload, null, 2));

    const {
      ResponseCode,
      ResponseDescription,
      TransactionID,
      TransactionAmount,
      TransactionReceipt,
      TransactionDate,
      TransactionReference,
      Msisdn,
    } = payload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const isSuccess = Number(ResponseCode) === 0;
    const reference = TransactionReference as string | undefined;

    if (!reference) {
      console.error('Missing TransactionReference in callback');
      return new Response(JSON.stringify({ status: 'received' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (reference.startsWith('savings_')) {
      if (isSuccess) {
        const { data: deposit, error: updateError } = await supabase
          .from('savings_deposits')
          .update({
            verified: true,
            mpesa_message: `M-Pesa Receipt: ${TransactionReceipt || 'N/A'}. Paid on ${TransactionDate || 'N/A'}`,
          })
          .eq('transaction_code', reference)
          .select('user_id, amount')
          .single();

        if (updateError) {
          console.error('Error updating deposit:', updateError);
        } else if (deposit) {
          const { data: existingSavings } = await supabase
            .from('user_savings')
            .select('balance')
            .eq('user_id', deposit.user_id)
            .single();

          if (existingSavings) {
            await supabase
              .from('user_savings')
              .update({
                balance: existingSavings.balance + deposit.amount,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', deposit.user_id);
          } else {
            await supabase
              .from('user_savings')
              .insert({ user_id: deposit.user_id, balance: deposit.amount });
          }
        }
      } else {
        await supabase
          .from('savings_deposits')
          .update({
            verified: false,
            mpesa_message: `Payment failed: ${ResponseDescription || 'Unknown error'}`,
          })
          .eq('transaction_code', reference);
      }
    } else if (reference.startsWith('loan_')) {
      if (isSuccess) {
        await supabase
          .from('loan_disbursements')
          .update({
            payment_verified: true,
            transaction_code: TransactionReceipt || TransactionID || reference,
          })
          .eq('transaction_code', reference);
      } else {
        await supabase
          .from('loan_disbursements')
          .update({ payment_verified: false })
          .eq('transaction_code', reference);
      }
    }

    return new Response(
      JSON.stringify({ status: isSuccess ? 'success' : 'received' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing Paywave callback:', error);
    return new Response(
      JSON.stringify({ status: 'error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
