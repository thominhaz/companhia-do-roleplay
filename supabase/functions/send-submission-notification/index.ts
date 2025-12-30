import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  creatorName: string;
  submissionType: 'npc' | 'item';
  submissionName: string;
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, creatorName, submissionType, submissionName, status, adminNotes }: NotificationRequest = await req.json();

    console.log(`Sending ${status} notification to ${email} for ${submissionType}: ${submissionName}`);

    const isApproved = status === 'approved';
    const typeLabel = submissionType === 'npc' ? 'NPC' : 'Item Mágico';
    
    const subject = isApproved 
      ? `✨ Sua criação "${submissionName}" foi aprovada!`
      : `📋 Atualização sobre sua submissão "${submissionName}"`;

    const html = isApproved 
      ? `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 30px; color: #fff;">
            <h1 style="margin: 0 0 20px 0; font-size: 24px; text-align: center;">
              ✨ Parabéns, ${creatorName}! ✨
            </h1>
            
            <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 16px;">
                Sua criação de <strong>${typeLabel}</strong> foi <span style="color: #4ade80; font-weight: bold;">APROVADA</span>!
              </p>
              <p style="margin: 0; font-size: 18px; color: #fbbf24;">
                📜 "${submissionName}"
              </p>
            </div>
            
            <p style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
              Seu ${typeLabel.toLowerCase()} agora faz parte da <strong>Galeria de Apoiadores</strong> do GO20 
              e estará disponível para toda a comunidade usar em suas aventuras!
            </p>
            
            ${adminNotes ? `
              <div style="background: rgba(59, 130, 246, 0.2); border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 5px 0; font-size: 12px; color: #93c5fd;">Nota do Admin:</p>
                <p style="margin: 0; font-size: 14px;">${adminNotes}</p>
              </div>
            ` : ''}
            
            <p style="margin: 30px 0 0 0; font-size: 14px; text-align: center; color: #a1a1aa;">
              Obrigado por contribuir com a comunidade! 🎲
            </p>
          </div>
          
          <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #71717a;">
            GO20 - Seu Companheiro de RPG
          </p>
        </div>
      `
      : `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 30px; color: #fff;">
            <h1 style="margin: 0 0 20px 0; font-size: 24px; text-align: center;">
              Olá, ${creatorName}
            </h1>
            
            <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 16px;">
                Infelizmente sua submissão de <strong>${typeLabel}</strong> não foi aprovada desta vez.
              </p>
              <p style="margin: 0; font-size: 18px; color: #fbbf24;">
                📜 "${submissionName}"
              </p>
            </div>
            
            ${adminNotes ? `
              <div style="background: rgba(239, 68, 68, 0.2); border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 5px 0; font-size: 12px; color: #fca5a5;">Motivo:</p>
                <p style="margin: 0; font-size: 14px;">${adminNotes}</p>
              </div>
            ` : ''}
            
            <p style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
              Não desanime! Você pode fazer uma nova submissão a qualquer momento. 
              Revise os detalhes e tente novamente.
            </p>
            
            <p style="margin: 30px 0 0 0; font-size: 14px; text-align: center; color: #a1a1aa;">
              Obrigado por contribuir! 🎲
            </p>
          </div>
          
          <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #71717a;">
            GO20 - Seu Companheiro de RPG
          </p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "GO20 <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
