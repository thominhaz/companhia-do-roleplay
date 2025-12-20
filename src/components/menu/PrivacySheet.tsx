import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Shield, Database, Lock, Eye, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacySheet({ open, onOpenChange }: PrivacySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacidade
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-8rem)] pb-8">
          <div className="space-y-6 pr-4">
            {/* Overview */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">Seu dados estão seguros</h4>
              <p className="text-sm text-muted-foreground">
                Levamos a privacidade a sério. Seus dados de personagens e campanhas são criptografados e protegidos.
              </p>
            </div>

            {/* Data Collection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Dados Coletados</h4>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Email e nome de exibição para identificação da conta</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Dados de personagens e campanhas que você criar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Informações de uso para melhorar o aplicativo</span>
                </li>
              </ul>
            </div>

            {/* Security */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Segurança</h4>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Criptografia SSL/TLS em todas as comunicações</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Senhas criptografadas com algoritmos seguros</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Acesso restrito por Row Level Security (RLS)</span>
                </li>
              </ul>
            </div>

            {/* Data Sharing */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Compartilhamento</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins de marketing. 
                Dados de campanhas são compartilhados apenas com membros autorizados da mesma campanha.
              </p>
            </div>

            {/* Data Deletion */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Exclusão de Dados</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Você pode solicitar a exclusão completa dos seus dados a qualquer momento. 
                Isso inclui sua conta, personagens, campanhas e todas as informações associadas.
              </p>
              <p className="text-xs text-muted-foreground">
                Para solicitar exclusão, entre em contato: suporte@go20.app
              </p>
            </div>

            {/* Last Updated */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Última atualização: Dezembro 2024
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}