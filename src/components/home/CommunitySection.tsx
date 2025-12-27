import { MessageCircle, Github, Instagram, Coffee, Heart, Users, ExternalLink } from "lucide-react";

const communityLinks = [
  {
    id: "discord",
    label: "Discord",
    description: "Entre na comunidade",
    icon: MessageCircle,
    href: "https://discord.gg/AP9UeE5paj",
    gradient: "from-[#5865F2] to-[#5865F2]/70",
    external: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Siga o projeto",
    icon: Instagram,
    href: "https://instagram.com/go20app",
    gradient: "from-[#E1306C] to-[#833AB4]",
    external: true,
  },
  {
    id: "github",
    label: "GitHub",
    description: "Contribua com código",
    icon: Github,
    href: "https://github.com/go20app",
    gradient: "from-muted-foreground to-muted-foreground/70",
    external: true,
  },
  {
    id: "donate",
    label: "Apoiar",
    description: "Ajude o projeto",
    icon: Coffee,
    href: "https://apoia.se/go20",
    gradient: "from-solar-orange to-solar-orange/70",
    external: true,
  },
];

export function CommunitySection() {
  return (
    <section className="px-4 sm:px-5 mt-6 sm:mt-8">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground">COMUNIDADE</h2>
      </div>
      
      <div className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-purple to-magenta-red flex items-center justify-center">
            <Heart className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Faça parte da comunidade</h3>
            <p className="text-xs text-muted-foreground">Conecte-se, contribua e ajude o Go20 a crescer</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {communityLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-all duration-300 card-hover"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <link.icon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-semibold">{link.label}</span>
                  {link.external && (
                    <ExternalLink className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground hidden sm:block">{link.description}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-center text-muted-foreground">
            Go20 é um projeto open source feito com <Heart className="w-3 h-3 inline text-magenta-red" /> pela comunidade
          </p>
        </div>
      </div>
    </section>
  );
}
