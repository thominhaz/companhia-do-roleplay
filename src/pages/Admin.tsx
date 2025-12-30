import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Target,
  Users,
  Sword,
  User,
  FileText,
  DollarSign,
  Settings,
  Shield,
} from "lucide-react";

// Import admin sections
import AdminStretchGoalsSection from "@/components/admin/AdminStretchGoalsSection";
import AdminSupportersSection from "@/components/admin/AdminSupportersSection";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("metas");

  // Check if user is admin
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      return data || false;
    },
    enabled: !!user,
  });

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-16 w-full mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground text-center">
          Você não tem permissão para acessar esta página.
        </p>
        <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Painel Admin | Go20</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/10">
          <div className="container mx-auto px-4 h-16 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cosmic-purple to-solar-orange">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Painel Administrativo</h1>
                <p className="text-sm text-muted-foreground">Gerencie a plataforma Go20</p>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <QuickStatCard
              icon={Target}
              label="Metas"
              description="Stretch Goals"
              onClick={() => setActiveTab("metas")}
              active={activeTab === "metas"}
            />
            <QuickStatCard
              icon={Users}
              label="Apoiadores"
              description="Galeria Catarse"
              onClick={() => setActiveTab("apoiadores")}
              active={activeTab === "apoiadores"}
            />
            <QuickStatCard
              icon={Sword}
              label="Itens"
              description="Itens de Apoiadores"
              onClick={() => setActiveTab("itens")}
              active={activeTab === "itens"}
            />
            <QuickStatCard
              icon={User}
              label="NPCs"
              description="NPCs de Apoiadores"
              onClick={() => setActiveTab("npcs")}
              active={activeTab === "npcs"}
            />
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="metas" className="gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Metas</span>
              </TabsTrigger>
              <TabsTrigger value="apoiadores" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Apoiadores</span>
              </TabsTrigger>
              <TabsTrigger value="itens" className="gap-2">
                <Sword className="h-4 w-4" />
                <span className="hidden sm:inline">Itens</span>
              </TabsTrigger>
              <TabsTrigger value="npcs" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">NPCs</span>
              </TabsTrigger>
              <TabsTrigger value="submissoes" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Submissões</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="metas">
              <AdminStretchGoalsSection />
            </TabsContent>

            <TabsContent value="apoiadores">
              <AdminSupportersSection section="supporters" />
            </TabsContent>

            <TabsContent value="itens">
              <AdminSupportersSection section="items" />
            </TabsContent>

            <TabsContent value="npcs">
              <AdminSupportersSection section="npcs" />
            </TabsContent>

            <TabsContent value="submissoes">
              <AdminSupportersSection section="submissions" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

interface QuickStatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
  active: boolean;
}

function QuickStatCard({ icon: Icon, label, description, onClick, active }: QuickStatCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:scale-[1.02] ${
        active
          ? "bg-gradient-to-br from-cosmic-purple/30 to-solar-orange/30 border-cosmic-purple/50"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
      onClick={onClick}
    >
      <Icon className={`h-6 w-6 mb-2 ${active ? "text-solar-orange" : "text-muted-foreground"}`} />
      <h3 className="font-semibold">{label}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Card>
  );
}
