import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HelpCircle, ExternalLink, MessageCircle, Mail, User, Swords, BookOpen, CreditCard, Settings, Users } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface HelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const faqCategories = [
  {
    title: "Personagens",
    icon: User,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    faqs: [
      {
        question: "Como criar um personagem?",
        answer: "Vá para a aba 'Personagens' e clique no botão '+' no canto superior direito. Siga o assistente de criação passo a passo, escolhendo raça, classe, atributos e habilidades."
      },
      {
        question: "Quantos personagens posso criar?",
        answer: "Usuários gratuitos podem criar até 3 personagens. Assinantes do plano Aldeão têm até 10 personagens, enquanto Heróis e Mestres têm personagens ilimitados."
      },
      {
        question: "Como subir de nível?",
        answer: "Na ficha do personagem, toque no nível atual ou acesse o menu de opções (três pontos) e selecione 'Subir de Nível'. O sistema guiará você pelas escolhas do novo nível."
      },
      {
        question: "Posso editar meu personagem depois de criar?",
        answer: "Sim! Você pode editar qualquer aspecto do personagem a qualquer momento. Basta acessar a ficha e tocar nos campos que deseja modificar."
      },
      {
        question: "O que são condições?",
        answer: "Condições são estados especiais que afetam seu personagem (como Envenenado, Atordoado, etc). Você pode gerenciá-las na seção de combate da ficha."
      },
    ]
  },
  {
    title: "Campanhas",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    faqs: [
      {
        question: "Como criar uma campanha?",
        answer: "Na aba 'Campanhas', toque em '+' e preencha os dados da campanha. Você será automaticamente o Mestre dessa campanha."
      },
      {
        question: "Como entrar em uma campanha?",
        answer: "Peça ao Mestre o código de convite da campanha. Depois, vá em Campanhas > 'Participar' e insira o código de 6 caracteres."
      },
      {
        question: "Como convidar jogadores?",
        answer: "Como Mestre, acesse sua campanha e vá em Configurações. Lá você encontrará o código de convite para compartilhar com seus jogadores."
      },
      {
        question: "Posso ter múltiplas campanhas?",
        answer: "Sim! Usuários gratuitos podem participar de até 2 campanhas. Assinantes têm limites maiores ou ilimitados dependendo do plano."
      },
      {
        question: "O chat da campanha funciona em tempo real?",
        answer: "Sim! As mensagens são sincronizadas instantaneamente entre todos os membros da campanha."
      },
    ]
  },
  {
    title: "Combate",
    icon: Swords,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    faqs: [
      {
        question: "Como funciona o Combat Tracker?",
        answer: "O Combat Tracker permite gerenciar combates com ordem de iniciativa, HP dos participantes e condições. Está disponível para Mestres com plano Herói ou superior."
      },
      {
        question: "Como rolar dados?",
        answer: "Use o Rolador de Dados na aba Ferramentas. Você pode criar expressões complexas (ex: 2d6+4) ou usar os botões rápidos para dados comuns."
      },
      {
        question: "Posso rolar dados dentro da campanha?",
        answer: "Sim! Você pode enviar resultados de rolagens diretamente no chat da campanha para que todos vejam."
      },
      {
        question: "Como adicionar monstros ao combate?",
        answer: "No Combat Tracker, use o botão '+' para adicionar combatentes. Você pode inserir NPCs/monstros com nome, HP e CA personalizados."
      },
    ]
  },
  {
    title: "Ferramentas & Compêndio",
    icon: BookOpen,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    faqs: [
      {
        question: "Onde encontro as regras do jogo?",
        answer: "Na aba 'Ferramentas' você encontra referências rápidas de condições, armas, armaduras e regras básicas do SRD 5e."
      },
      {
        question: "O que é o Grimório de Magias?",
        answer: "É um compêndio completo de magias do SRD 5e. Você pode pesquisar, filtrar por classe/nível e ver todos os detalhes de cada magia."
      },
      {
        question: "Como funcionam as notas rápidas?",
        answer: "As notas rápidas permitem salvar anotações pessoais que ficam sincronizadas na sua conta. Útil para anotar ideias, NPCs ou eventos da sessão."
      },
      {
        question: "O que é o Forja Homebrew?",
        answer: "É onde você pode criar conteúdo personalizado: magias, itens, raças, classes e monstros customizados para usar em suas campanhas."
      },
    ]
  },
  {
    title: "Assinatura & Conta",
    icon: CreditCard,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    faqs: [
      {
        question: "Quais são os planos disponíveis?",
        answer: "Oferecemos: Gratuito (recursos básicos), Aldeão (mais personagens e campanhas), Herói (Combat Tracker e Homebrew) e Mestre (todos os recursos + prioridade)."
      },
      {
        question: "Como assinar um plano?",
        answer: "Vá em Menu > Assinatura e escolha o plano desejado. Aceitamos cartões de crédito e PIX para pagamentos."
      },
      {
        question: "Como cancelar minha assinatura?",
        answer: "Em Menu > Assinatura, você encontra a opção de cancelar. O acesso Premium continua até o fim do período já pago."
      },
      {
        question: "Perco meus dados se cancelar?",
        answer: "Não! Seus personagens e campanhas ficam salvos. Você apenas perde acesso aos recursos Premium, mas pode voltar a qualquer momento."
      },
      {
        question: "Como usar um código promocional?",
        answer: "Em Menu > Assinatura, há um campo para inserir códigos promocionais. Os benefícios são aplicados imediatamente após a validação."
      },
    ]
  },
  {
    title: "Configurações",
    icon: Settings,
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
    faqs: [
      {
        question: "Posso usar o app offline?",
        answer: "Atualmente o app requer conexão com internet para sincronizar dados. O suporte offline está planejado para futuras versões."
      },
      {
        question: "Como alterar minha foto de perfil?",
        answer: "Em Menu > Editar Perfil, você pode fazer upload de uma nova foto ou conectar com sua conta Discord para usar o avatar de lá."
      },
      {
        question: "Como conectar com Discord?",
        answer: "Em Menu > Conectar Discord, você pode vincular sua conta para notificações e sincronização de avatar."
      },
      {
        question: "Como alterar o tema do app?",
        answer: "Em Menu > Aparência, você pode escolher entre tema claro, escuro ou automático (segue o sistema)."
      },
      {
        question: "Como excluir minha conta?",
        answer: "Entre em contato pelo email suporte@go20.app solicitando a exclusão. Processamos pedidos em até 48 horas úteis."
      },
    ]
  },
];

export function HelpSheet({ open, onOpenChange }: HelpSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Central de Ajuda
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-8rem)] pb-8">
          <div className="space-y-6 pr-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
                <p className="text-2xl font-bold text-primary">{faqCategories.reduce((acc, cat) => acc + cat.faqs.length, 0)}</p>
                <p className="text-xs text-muted-foreground">Perguntas</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                <p className="text-2xl font-bold text-green-500">{faqCategories.length}</p>
                <p className="text-xs text-muted-foreground">Categorias</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-2xl font-bold text-amber-500">24h</p>
                <p className="text-xs text-muted-foreground">Suporte</p>
              </div>
            </div>

            {/* FAQ Categories */}
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${category.bgColor} flex items-center justify-center`}>
                    <category.icon className={`w-4 h-4 ${category.color}`} />
                  </div>
                  <h4 className="font-semibold text-foreground">{category.title}</h4>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {category.faqs.length}
                  </Badge>
                </div>
                
                <Accordion type="single" collapsible className="space-y-1.5">
                  {category.faqs.map((faq, faqIndex) => (
                    <AccordionItem 
                      key={faqIndex} 
                      value={`cat-${categoryIndex}-item-${faqIndex}`}
                      className="border border-border rounded-xl px-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3 text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-3 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}

            {/* Didn't find answer */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <h4 className="font-semibold text-foreground mb-2">Não encontrou sua resposta?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Nossa equipe está pronta para ajudar! Entre em contato por um dos canais abaixo.
              </p>
              
              <div className="space-y-2">
                <a 
                  href="mailto:suporte@go20.app" 
                  className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">Email</p>
                    <p className="text-xs text-muted-foreground truncate">suporte@go20.app</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </a>
                
                <a 
                  href="https://discord.gg/go20" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[#5865F2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">Discord</p>
                    <p className="text-xs text-muted-foreground truncate">Comunidade Go20</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </a>
              </div>
            </div>

            {/* App Version */}
            <div className="pt-2 text-center">
              <p className="text-xs text-muted-foreground">
                Go20 v1.0.0 • Última atualização do FAQ: Dezembro 2024
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
