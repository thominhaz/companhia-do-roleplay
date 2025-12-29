import { useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, Check, User, Sword } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const NPC_FORM = `📋 FORMULÁRIO DE CRIAÇÃO DE NPC PERSONALIZADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎭 INFORMAÇÕES DO PERSONAGEM

Nome do NPC:

Título/Apelido (opcional):
(Ex: "O Sábio", "Guardião da Floresta")

Localização:
(Onde esse NPC costuma ser encontrado?)

Ocupação/Profissão:
(Ex: Ferreiro, Mago, Comerciante, Aventureiro)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 DESCRIÇÃO

Descrição Geral:
(Breve resumo de quem é esse personagem)

Aparência:
(Como ele se parece? Roupas, características físicas marcantes)

Personalidade:
(Como ele age? Quais seus traços de personalidade?)

História de Fundo:
(Qual a história desse personagem? O que o motiva?)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏷️ EXTRAS

Tags (separadas por vírgula):
(Ex: misterioso, amigável, comerciante, mago)

Imagem (opcional):
(Envie uma imagem ou link para referência visual)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ CRÉDITOS (como você quer aparecer no app)

Seu Nome:

Mensagem para a comunidade (opcional):
(Algo que você queira dizer aos outros jogadores)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

const ITEM_FORM = `📋 FORMULÁRIO DE CRIAÇÃO DE ITEM MÁGICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚔️ INFORMAÇÕES DO ITEM

Nome do Item:

Tipo do Item:
[ ] Arma
[ ] Armadura
[ ] Anel
[ ] Cajado/Varinha
[ ] Poção
[ ] Pergaminho
[ ] Item Maravilhoso
[ ] Outro: _______________

Raridade:
[ ] Comum
[ ] Incomum
[ ] Raro
[ ] Muito Raro
[ ] Lendário

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 DESCRIÇÃO E PODERES

Descrição e Poderes:
(Descreva o item e suas habilidades mágicas)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚔️ ESTATÍSTICAS (preencha o que se aplicar)

Dano (se for arma):
(Ex: 1d8, 2d6)

Tipo de Dano (se for arma):
(Ex: Cortante, Perfurante, Contundente, Fogo, Gelo)

Bônus de CA (se for armadura/escudo):
(Ex: +1, +2)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔮 SINTONIZAÇÃO

Requer Sintonização?
[ ] Sim
[ ] Não

Se sim, requisitos (opcional):
(Ex: "por um conjurador", "por um paladino")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ EXTRAS

Propriedades Especiais (opcional):
(Características únicas ou efeitos adicionais)

Tags (separadas por vírgula):
(Ex: fogo, defesa, cura, combate)

Imagem (opcional):
(Envie uma imagem ou link para referência visual)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ CRÉDITOS (como você quer aparecer no app)

Seu Nome:

Mensagem para a comunidade (opcional):
(Algo que você queira dizer aos outros jogadores)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

export default function SupporterForms() {
  const navigate = useNavigate();
  const [copiedNpc, setCopiedNpc] = useState(false);
  const [copiedItem, setCopiedItem] = useState(false);

  const copyToClipboard = async (text: string, type: "npc" | "item") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "npc") {
        setCopiedNpc(true);
        setTimeout(() => setCopiedNpc(false), 2000);
      } else {
        setCopiedItem(true);
        setTimeout(() => setCopiedItem(false), 2000);
      }
      toast({
        title: "Copiado!",
        description: "Formulário copiado para a área de transferência.",
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o formulário.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Formulários de Apoiadores | Go20</title>
      </Helmet>

      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Formulários de Apoiadores</h1>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Como usar</CardTitle>
            <CardDescription>
              Copie o formulário desejado e envie para o apoiador preencher. 
              Depois, use as informações para cadastrar no painel de administração.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="npc" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="npc" className="flex-1 gap-2">
              <User className="h-4 w-4" />
              NPC
            </TabsTrigger>
            <TabsTrigger value="item" className="flex-1 gap-2">
              <Sword className="h-4 w-4" />
              Item Mágico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="npc" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Formulário de NPC</CardTitle>
                <Button
                  variant={copiedNpc ? "default" : "outline"}
                  size="sm"
                  onClick={() => copyToClipboard(NPC_FORM, "npc")}
                  className="gap-2"
                >
                  {copiedNpc ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg overflow-x-auto">
                  {NPC_FORM}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="item" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Formulário de Item Mágico</CardTitle>
                <Button
                  variant={copiedItem ? "default" : "outline"}
                  size="sm"
                  onClick={() => copyToClipboard(ITEM_FORM, "item")}
                  className="gap-2"
                >
                  {copiedItem ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg overflow-x-auto">
                  {ITEM_FORM}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
