import {
  User,
  Settings,
  Bell,
  Moon,
  HelpCircle,
  Shield,
  Crown,
  LogOut,
  ChevronRight,
  Cloud,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuSections = [
  {
    title: "Conta",
    items: [
      {
        id: "profile",
        label: "Meu Perfil",
        description: "Editar informações pessoais",
        icon: User,
        hasArrow: true,
      },
      {
        id: "subscription",
        label: "Assinatura",
        description: "Plano Gratuito",
        icon: Crown,
        badge: "Upgrade",
        badgeColor: "secondary",
        hasArrow: true,
      },
      {
        id: "sync",
        label: "Sincronização",
        description: "Última sincronização: agora",
        icon: Cloud,
        hasArrow: true,
      },
    ],
  },
  {
    title: "Preferências",
    items: [
      {
        id: "notifications",
        label: "Notificações",
        description: "Sessões e atualizações",
        icon: Bell,
        hasArrow: true,
      },
      {
        id: "appearance",
        label: "Aparência",
        description: "Tema escuro",
        icon: Moon,
        hasArrow: true,
      },
    ],
  },
  {
    title: "Suporte",
    items: [
      {
        id: "help",
        label: "Ajuda & FAQ",
        description: "Perguntas frequentes",
        icon: HelpCircle,
        hasArrow: true,
      },
      {
        id: "privacy",
        label: "Privacidade",
        description: "Política de privacidade",
        icon: Shield,
        hasArrow: true,
        external: true,
      },
    ],
  },
];

export function MenuScreen() {
  const user = {
    name: "Aventureiro",
    email: "jogador@wardRPG.com",
    isPremium: false,
  };

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Menu</h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* User Card */}
        <section className="animate-fade-in">
          <button className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:border-primary/50 transition-all">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-foreground">
                {user.name[0]}
              </span>
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  {user.name}
                </h2>
                {user.isPremium && (
                  <Crown className="w-4 h-4 text-gold" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </section>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <section
            key={section.title}
            className="animate-fade-in"
            style={{ animationDelay: `${(sectionIndex + 1) * 0.1}s` }}
          >
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {section.title}
            </h2>
            <div className="glass rounded-2xl overflow-hidden divide-y divide-border/50">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className={cn(
                              "px-1.5 py-0.5 text-[10px] font-semibold rounded-full",
                              item.badgeColor === "secondary"
                                ? "bg-secondary/20 text-secondary"
                                : "bg-primary/20 text-primary"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                    {item.external ? (
                      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : item.hasArrow ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {/* Logout */}
        <section
          className="animate-fade-in"
          style={{ animationDelay: `${(menuSections.length + 1) * 0.1}s` }}
        >
          <button className="w-full glass rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-destructive/50 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-sm font-medium text-destructive">
              Sair da Conta
            </span>
          </button>
        </section>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          Ward RPG v1.0.0
        </p>
      </main>
    </div>
  );
}
