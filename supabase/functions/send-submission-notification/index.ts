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
  submissionDescription?: string;
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

const getTypeLabel = (type: 'npc' | 'item') => type === 'npc' ? 'NPC' : 'Item Mágico';
const getTypeEmoji = (type: 'npc' | 'item') => type === 'npc' ? '👤' : '📜';

const generateApprovedEmail = (data: NotificationRequest) => {
  const typeLabel = getTypeLabel(data.submissionType);
  const typeEmoji = getTypeEmoji(data.submissionType);
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aprovação - GO20</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@400;600&display=swap');
    body { margin: 0; padding: 0; background-color: #0f172a; }
    @media only screen and (max-width: 600px) {
        .container { width: 100% !important; }
        .content-padding { padding: 20px !important; }
        .item-card { padding: 15px !important; }
    }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a;">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background: linear-gradient(160deg, #1e1b4b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid #312e81; box-shadow: 0 0 25px rgba(79, 70, 229, 0.15); overflow: hidden;">
                    
                    <!-- Barra de Raridade -->
                    <tr>
                        <td height="6" style="background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);"></td>
                    </tr>

                    <!-- Cabeçalho -->
                    <tr>
                        <td class="content-padding" align="center" style="padding: 40px 40px 20px 40px;">
                            <div style="display: inline-block; background-color: rgba(251, 191, 36, 0.1); border-radius: 50%; padding: 12px; margin-bottom: 20px; border: 1px solid rgba(251, 191, 36, 0.3);">
                                <span style="font-size: 32px; line-height: 1;">✨</span>
                            </div>
                            
                            <h1 style="color: #ffffff; font-family: 'Cinzel', 'Georgia', serif; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                LEVEL UP, ${data.creatorName.toUpperCase()}!
                            </h1>
                            <p style="color: #94a3b8; font-size: 16px; margin-top: 10px; margin-bottom: 0;">
                                Sua contribuição foi lendária.
                            </p>
                        </td>
                    </tr>

                    <!-- Card do Item/NPC -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(0, 0, 0, 0.3); border: 1px solid #4338ca; border-radius: 12px; margin: 20px 0;">
                                <tr>
                                    <td class="item-card" style="padding: 25px; text-align: center;">
                                        <p style="color: #4ade80; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">
                                            ${typeLabel}: APROVADO
                                        </p>
                                        
                                        <h2 style="margin: 10px 0; font-size: 24px; color: #fbbf24; text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);">
                                            ${typeEmoji} ${data.submissionName}
                                        </h2>
                                        
                                        ${data.submissionDescription ? `
                                        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0; font-style: italic;">
                                            "${data.submissionDescription}"
                                        </p>
                                        ` : ''}
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6; text-align: center; margin: 20px 0;">
                                ${data.submissionType === 'npc' 
                                  ? 'Seu NPC foi adicionado à <strong>Galeria de Apoiadores</strong> do GO20 e já pode ser encontrado por toda a comunidade!'
                                  : 'Seu item mágico foi adicionado à <strong>Galeria de Apoiadores</strong> do GO20 e já pode ser equipado por toda a comunidade!'}
                            </p>

                            ${data.adminNotes ? `
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 25px;">
                                <tr>
                                    <td style="background-color: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 15px; border-radius: 0 8px 8px 0;">
                                        <p style="margin: 0; font-size: 12px; color: #60a5fa; font-weight: bold; text-transform: uppercase;">
                                            Mensagem do Mestre (Admin)
                                        </p>
                                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #dbeafe; font-style: italic;">
                                            "${data.adminNotes}"
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}

                            <!-- Botão -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://go20.com.br/apoiadores" style="background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); border: 1px solid rgba(255,255,255,0.1);">
                                            Ver na Galeria 🎲
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Rodapé -->
                    <tr>
                        <td align="center" style="padding: 20px 40px 30px 40px; border-top: 1px solid #1e293b;">
                            <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
                                Enviado por <strong>GO20</strong> • Seu Companheiro de RPG<br>
                                Obrigado por fazer parte da nossa história.
                            </p>
                        </td>
                    </tr>
                </table>
                <div style="height: 40px;"></div>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

const generateRejectedEmail = (data: NotificationRequest) => {
  const typeLabel = getTypeLabel(data.submissionType);
  const typeEmoji = getTypeEmoji(data.submissionType);
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Atualização - GO20</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@400;600&display=swap');
    body { margin: 0; padding: 0; background-color: #0f172a; }
    @media only screen and (max-width: 600px) {
        .container { width: 100% !important; }
        .content-padding { padding: 20px !important; }
        .item-card { padding: 15px !important; }
    }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a;">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background: linear-gradient(160deg, #1e1b4b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid #312e81; box-shadow: 0 0 25px rgba(79, 70, 229, 0.15); overflow: hidden;">
                    
                    <!-- Barra -->
                    <tr>
                        <td height="6" style="background: linear-gradient(90deg, #64748b 0%, #475569 100%);"></td>
                    </tr>

                    <!-- Cabeçalho -->
                    <tr>
                        <td class="content-padding" align="center" style="padding: 40px 40px 20px 40px;">
                            <div style="display: inline-block; background-color: rgba(148, 163, 184, 0.1); border-radius: 50%; padding: 12px; margin-bottom: 20px; border: 1px solid rgba(148, 163, 184, 0.3);">
                                <span style="font-size: 32px; line-height: 1;">📋</span>
                            </div>
                            
                            <h1 style="color: #ffffff; font-family: 'Cinzel', 'Georgia', serif; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                OLÁ, ${data.creatorName.toUpperCase()}
                            </h1>
                            <p style="color: #94a3b8; font-size: 16px; margin-top: 10px; margin-bottom: 0;">
                                Temos uma atualização sobre sua submissão.
                            </p>
                        </td>
                    </tr>

                    <!-- Card -->
                    <tr>
                        <td class="content-padding" style="padding: 0 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(0, 0, 0, 0.3); border: 1px solid #475569; border-radius: 12px; margin: 20px 0;">
                                <tr>
                                    <td class="item-card" style="padding: 25px; text-align: center;">
                                        <p style="color: #f87171; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">
                                            ${typeLabel}: NÃO APROVADO
                                        </p>
                                        
                                        <h2 style="margin: 10px 0; font-size: 24px; color: #94a3b8;">
                                            ${typeEmoji} ${data.submissionName}
                                        </h2>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6; text-align: center; margin: 20px 0;">
                                Infelizmente sua submissão não foi aprovada desta vez, mas não desanime! 
                                Você pode revisar os detalhes e enviar uma nova versão.
                            </p>

                            ${data.adminNotes ? `
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 25px;">
                                <tr>
                                    <td style="background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px; border-radius: 0 8px 8px 0;">
                                        <p style="margin: 0; font-size: 12px; color: #fca5a5; font-weight: bold; text-transform: uppercase;">
                                            Motivo / Feedback
                                        </p>
                                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #fecaca; font-style: italic;">
                                            "${data.adminNotes}"
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}

                            <!-- Botão -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://go20.com.br/apoiadores/submeter" style="background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); border: 1px solid rgba(255,255,255,0.1);">
                                            Tentar Novamente 🎲
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Rodapé -->
                    <tr>
                        <td align="center" style="padding: 20px 40px 30px 40px; border-top: 1px solid #1e293b;">
                            <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
                                Enviado por <strong>GO20</strong> • Seu Companheiro de RPG<br>
                                Obrigado por fazer parte da nossa história.
                            </p>
                        </td>
                    </tr>
                </table>
                <div style="height: 40px;"></div>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();

    console.log(`Sending ${data.status} notification to ${data.email} for ${data.submissionType}: ${data.submissionName}`);

    const isApproved = data.status === 'approved';
    const typeLabel = getTypeLabel(data.submissionType);
    
    const subject = isApproved 
      ? `✨ Sua criação "${data.submissionName}" foi aprovada!`
      : `📋 Atualização sobre sua submissão "${data.submissionName}"`;

    const html = isApproved 
      ? generateApprovedEmail(data)
      : generateRejectedEmail(data);

    const emailResponse = await resend.emails.send({
      from: "GO20 <contato@go20.com.br>",
      to: [data.email],
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
