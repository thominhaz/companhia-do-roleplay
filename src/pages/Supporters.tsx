import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Shield, Sword, Heart, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";

interface Supporter {
  id: string;
  name: string;
  tier: string;
  message: string | null;
}

const TIER_CONFIG: Record<string, { 
  label: string; 
  icon: React.ElementType; 
  color: string;
  bgGradient: string;
  order: number;
}> = {
  lendario: {
    label: "Lendário",
    icon: Crown,
    color: "text-yellow-400",
    bgGradient: "from-yellow-500/20 to-amber-600/10",
    order: 1,
  },
  mestre_epico: {
    label: "Mestre Épico",
    icon: Star,
    color: "text-purple-400",
    bgGradient: "from-purple-500/20 to-violet-600/10",
    order: 2,
  },
  mestre: {
    label: "Mestre",
    icon: Shield,
    color: "text-blue-400",
    bgGradient: "from-blue-500/20 to-cyan-600/10",
    order: 3,
  },
  heroi: {
    label: "Herói",
    icon: Sword,
    color: "text-emerald-400",
    bgGradient: "from-emerald-500/20 to-green-600/10",
    order: 4,
  },
  aldeao: {
    label: "Aldeão",
    icon: Users,
    color: "text-orange-400",
    bgGradient: "from-orange-500/20 to-amber-600/10",
    order: 5,
  },
  apoiador: {
    label: "Apoiador",
    icon: Heart,
    color: "text-rose-400",
    bgGradient: "from-rose-500/20 to-pink-600/10",
    order: 6,
  },
};

export default function Supporters() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSupporters() {
      const { data, error } = await supabase
        .from("catarse_supporters")
        .select("id, name, tier, message")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setSupporters(data);
      }
      setLoading(false);
    }
    fetchSupporters();
  }, []);

  // Group supporters by tier
  const groupedSupporters = supporters.reduce((acc, supporter) => {
    const tier = supporter.tier || "apoiador";
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(supporter);
    return acc;
  }, {} as Record<string, Supporter[]>);

  // Sort tiers by order
  const sortedTiers = Object.keys(groupedSupporters).sort((a, b) => {
    const orderA = TIER_CONFIG[a]?.order ?? 99;
    const orderB = TIER_CONFIG[b]?.order ?? 99;
    return orderA - orderB;
  });

  return (
    <>
      <Helmet>
        <title>Apoiadores | Go20 - Companheiro de RPG</title>
        <meta name="description" content="Conheça os apoiadores que tornaram o Go20 possível. Agradecemos a todos que apoiaram nossa campanha no Catarse." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container flex items-center gap-4 h-14 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold truncate">Apoiadores</h1>
          </div>
        </header>

        <main className="container px-4 py-8 pb-24">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Obrigado, Aventureiros!
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Essas pessoas incríveis apoiaram o Go20 no Catarse e tornaram este projeto possível.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : supporters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Ainda não há apoiadores cadastrados.</p>
              <p className="text-sm mt-2">
                Apoie no Catarse e tenha seu nome aqui!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedTiers.map((tier, tierIndex) => {
                const config = TIER_CONFIG[tier] || TIER_CONFIG.apoiador;
                const Icon = config.icon;
                const tierSupporters = groupedSupporters[tier];

                return (
                  <motion.section
                    key={tier}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: tierIndex * 0.1 }}
                  >
                    {/* Tier Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${config.bgGradient}`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <h3 className="text-lg font-semibold">{config.label}</h3>
                      <span className="text-sm text-muted-foreground">
                        ({tierSupporters.length})
                      </span>
                    </div>

                    {/* Supporters Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {tierSupporters.map((supporter, index) => (
                        <motion.div
                          key={supporter.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: tierIndex * 0.1 + index * 0.03 }}
                          className={`
                            relative p-4 rounded-xl border border-border/50
                            bg-gradient-to-br ${config.bgGradient}
                            hover:border-border transition-colors
                          `}
                        >
                          <p className="font-medium text-sm truncate">
                            {supporter.name}
                          </p>
                          {supporter.message && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              "{supporter.message}"
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </div>
          )}

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center"
          >
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <h3 className="text-lg font-semibold mb-2">Quer seu nome aqui?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Apoie o Go20 no Catarse e faça parte desta história!
              </p>
              <Button
                onClick={() => window.open("https://www.catarse.me/go20", "_blank")}
                className="gap-2"
              >
                <Heart className="h-4 w-4" />
                Apoiar no Catarse
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
}
