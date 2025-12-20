import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HelpCircle, ChevronDown, ExternalLink, MessageCircle, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface HelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const faqs = [
  {
    question: "Como criar um personagem?",
    answer: "Vá para a aba 'Personagens' e clique no botão '+' no canto superior direito. Siga o assistente de criação preenchendo as informações do seu personagem."
  },
  {
    question: "Quantos personagens posso criar?",
    answer: "Usuários gratuitos podem criar até 3 personagens. Usuários Premium têm personagens ilimitados."
  },
  {
    question: "Como funciona o Combat Tracker?",
    answer: "O Combat Tracker está disponível dentro das campanhas para usuários Premium. Ele permite gerenciar iniciativa, HP dos combatentes e condições durante o combate."
  },
  {
    question: "Posso usar offline?",
    answer: "Atualmente o app requer conexão com internet para sincronizar seus dados. Estamos trabalhando em suporte offline para futuras versões."
  },
  {
    question: "Como entrar em uma campanha?",
    answer: "Peça ao mestre da campanha o código de convite. Depois, vá em Campanhas > Participar e insira o código."
  },
  {
    question: "Como cancelar minha assinatura?",
    answer: "Você pode gerenciar sua assinatura na aba Menu > Assinatura. O cancelamento entrará em vigor no próximo ciclo de cobrança."
  },
];

export function HelpSheet({ open, onOpenChange }: HelpSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Ajuda & FAQ
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-8rem)] pb-8">
          {/* FAQ Section */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Perguntas Frequentes</h4>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border border-border rounded-xl px-4 bg-muted/50"
                >
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Precisa de mais ajuda?</h4>
            <div className="space-y-2">
              <a 
                href="mailto:suporte@go20.app" 
                className="flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-xs text-muted-foreground">suporte@go20.app</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
              
              <a 
                href="https://discord.gg/go20" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#5865F2]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Discord</p>
                  <p className="text-xs text-muted-foreground">Comunidade Go20</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}