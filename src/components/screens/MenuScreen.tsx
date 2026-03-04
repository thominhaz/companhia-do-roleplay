import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  User,
  Bell,
  Moon,
  HelpCircle,
  Shield,
  Crown,
  LogOut,
  ChevronRight,
  ExternalLink,
  LogIn,
  History,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/layout/AppHeader";
import { toast } from "sonner";
import { ProfileEditSheet } from "@/components/menu/ProfileEditSheet";
import { ChangelogSheet } from "@/components/menu/ChangelogSheet";
import { NotificationSettingsSheet } from "@/components/menu/NotificationSettingsSheet";
import { SubscriptionSheet } from "@/components/menu/SubscriptionSheet";
import { AppearanceSheet } from "@/components/menu/AppearanceSheet";
import { HelpSheet } from "@/components/menu/HelpSheet";
import { PrivacySheet } from "@/components/menu/PrivacySheet";
import { DiscordLinkSheet } from "@/components/menu/DiscordLinkSheet";
import { supabase } from "@/integrations/supabase/client";
import { CommunitySection } from "@/components/home/CommunitySection";

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
        icon: Crown,
        hasArrow: true,
        dynamic: true,
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
      {
        id: "discord",
        label: "Discord",
        description: "Vincular conta e cargos",
        icon: MessageCircle,
        hasArrow: true,
      },
    ],
  },
  {
    title: "Suporte",
    items: [
      {
        id: "changelog",
        label: "Novidades",
        description: "Histórico de atualizações",
        icon: History,
        hasArrow: true,
      },
      {
        id: "help",
        label: "Ajuda & FAQ",
        description: "Perguntas frequentes",
        icon: HelpCircle,
        hasArrow: true,
        external: true,
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
  const { user, signOut } = useAuth();
  const { data: subscription } = useSubscription();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [discordOpen, setDiscordOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch user profile avatar
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };
    
    fetchProfile();
  }, [user, profileOpen]); // Re-fetch when profile sheet closes (in case avatar was updated)

  // Handle Discord OAuth callback
  useEffect(() => {
    const discordStatus = searchParams.get('discord');
    if (discordStatus === 'linked') {
      toast.success("Discord vinculado com sucesso! 🎉");
      searchParams.delete('discord');
      setSearchParams(searchParams, { replace: true });
      setDiscordOpen(true); // Open the Discord sheet to show linked status
    }
  }, [searchParams, setSearchParams]);

  const handleLogout = async () => {
    await signOut();
    toast.success("Você saiu da conta");
    navigate("/auth");
  };

  const handleLogin = () => {
    navigate("/auth");
  };

  const handleMenuAction = (itemId: string) => {
    switch (itemId) {
      case "profile":
        if (user) {
          setProfileOpen(true);
        } else {
          navigate("/auth");
        }
        break;
      case "subscription":
        setSubscriptionOpen(true);
        break;
      case "notifications":
        if (user) {
          setNotificationsOpen(true);
        } else {
          navigate("/auth");
        }
        break;
      case "appearance":
        setAppearanceOpen(true);
        break;
      case "discord":
        if (user) {
          setDiscordOpen(true);
        } else {
          navigate("/auth");
        }
        break;
      case "changelog":
        setChangelogOpen(true);
        break;
      case "help":
        setHelpOpen(true);
        break;
      case "privacy":
        setPrivacyOpen(true);
        break;
    }
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Aventureiro";
  const currentTier = subscription?.tier || 'aldeao';
  const isPremium = currentTier === 'heroi' || currentTier === 'mestre';

  const getSubscriptionDescription = () => {
    if (!subscription) return "Carregando...";
    if (currentTier === 'mestre') return "Plano Mestre";
    if (currentTier === 'heroi') return "Plano Herói";
    return `Plano Aldeão • ${subscription.characterCount}/3 personagens`;
  };

  return (
    <div className="min-h-screen bg-surface-0 pb-24 md:pb-8">
      <AppHeader title="Menu" />

      {/* Content */}
      <main className="px-4 md:px-8 py-4 max-w-2xl mx-auto space-y-6">
        {/* User Card */}
        <section className="animate-fade-in">
          {user ? (
            <button 
              onClick={() => setProfileOpen(true)}
              className="w-full bg-surface-1 border border-border/30 rounded-2xl p-4 flex items-center gap-4 shadow-depth-sm transition-all hover:shadow-depth-md hover:-translate-y-0.5"
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-foreground">
                    {displayName[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    {displayName}
                  </h2>
                  {isPremium && (
                    <Crown className="w-4 h-4 text-gold" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ) : (
            <button 
              onClick={handleLogin}
              className="w-full bg-surface-1 border border-border/30 rounded-2xl p-4 flex items-center gap-4 shadow-depth-sm transition-all hover:shadow-depth-md hover:-translate-y-0.5"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <LogIn className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-base font-semibold text-foreground">
                  Entrar na conta
                </h2>
                <p className="text-xs text-muted-foreground">
                  Faça login para sincronizar seus dados
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
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
            <div className="bg-surface-1 border border-border/30 rounded-2xl overflow-hidden divide-y divide-border/20 shadow-depth-sm stagger-fast">
              {section.items.map((item) => {
                const Icon = item.icon;
                const description = item.id === "subscription" 
                  ? getSubscriptionDescription()
                  : item.description;
                const badge = item.id === "subscription" && !isPremium
                  ? "Upgrade"
                  : undefined;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuAction(item.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-2 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                        {badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-secondary/20 text-secondary">
                            {badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {description}
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

        {/* Community */}
        <CommunitySection />

        {/* Logout */}
        {user && (
          <section
            className="animate-fade-in"
            style={{ animationDelay: `${(menuSections.length + 1) * 0.1}s` }}
          >
            <button 
              onClick={handleLogout}
              className="w-full glass rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-destructive/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-sm font-medium text-destructive">
                Sair da Conta
              </span>
            </button>
          </section>
        )}

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          Go20 v1.0.0
        </p>
      </main>

      {/* Sheets */}
      <ProfileEditSheet open={profileOpen} onOpenChange={setProfileOpen} />
      <ChangelogSheet open={changelogOpen} onOpenChange={setChangelogOpen} />
      <NotificationSettingsSheet open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <SubscriptionSheet open={subscriptionOpen} onOpenChange={setSubscriptionOpen} />
      <AppearanceSheet open={appearanceOpen} onOpenChange={setAppearanceOpen} />
      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} />
      <PrivacySheet open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <DiscordLinkSheet open={discordOpen} onOpenChange={setDiscordOpen} />
    </div>
  );
}
