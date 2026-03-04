import { MessageCircle, Instagram, Coffee, Heart, Users, ExternalLink, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    id: "donate",
    label: "Apoiar",
    description: "Ajude o projeto",
    icon: Coffee,
    href: "https://apoia.se/go20",
    gradient: "from-solar-orange to-solar-orange/70",
    external: true,
  },
  {
    id: "supporters",
    label: "Apoiadores",
    description: "Veja quem apoiou",
    icon: Crown,
    href: "/apoiadores",
    gradient: "from-yellow-500 to-amber-600",
    external: false,
  },
];

export function CommunitySection() {
  const navigate = useNavigate();

  const handleLinkClick = (link: typeof communityLinks[0], e: React.MouseEvent) => {
    if (!link.external) {
      e.preventDefault();
      navigate(link.href);
    }
  };

  return (
    <section className="px-4 sm:px-5 mt-6 sm:mt-8">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground">COMUNIDADE</h2>
      </div>
      
      <div className="bg-white/[0.08] backdrop-blur-[20px] backdrop-saturate-150 border border-white/[0.15] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-2xl p-4 sm:p-5">
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
              onClick={(e) => handleLinkClick(link, e)}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 cursor-pointer"
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
            Go20 é um projeto feito com <Heart className="w-3 h-3 inline text-magenta-red" /> para a comunidade
          </p>
        </div>
      </div>
    </section>
  );
}
