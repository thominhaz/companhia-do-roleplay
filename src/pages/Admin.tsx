import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  KeyRound,
  Settings,
  Shield,
  Plus,
  Copy,
  Trash2,
  Search,
  Crown,
} from "lucide-react";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("usuarios");

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
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/10">
          <div className="container mx-auto px-4 h-16 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="usuarios" className="gap-2">
                <Users className="h-4 w-4" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="codigos" className="gap-2">
                <KeyRound className="h-4 w-4" />
                Códigos de Convite
              </TabsTrigger>
            </TabsList>

            <TabsContent value="usuarios">
              <UsersSection />
            </TabsContent>

            <TabsContent value="codigos">
              <InviteCodesSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

// ==================== USERS SECTION ====================

function UsersSection() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("user_id, status, expires_at");

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      return (profiles || []).map((p) => ({
        ...p,
        subscription: subs?.find((s) => s.user_id === p.id),
        roles: roles?.filter((r) => r.user_id === p.id).map((r) => r.role) || [],
      }));
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, hasRole }: { userId: string; role: string; hasRole: boolean }) => {
      if (hasRole) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Permissão atualizada!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = users?.filter((u) =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const roleOptions: { value: string; label: string; color: string }[] = [
    { value: "admin", label: "Admin", color: "bg-cosmic-purple/20 text-cosmic-purple border-cosmic-purple/30" },
    { value: "moderator", label: "Moderador", color: "bg-cyan-blue/20 text-cyan-blue border-cyan-blue/30" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="whitespace-nowrap">
          {users?.length || 0} usuários
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-2">
            {filtered?.map((u) => (
              <Card key={u.id} className="p-4 bg-white/5 border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.display_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">
                        Desde {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    {roleOptions.map((role) => {
                      const has = u.roles.includes(role.value);
                      return (
                        <button
                          key={role.value}
                          onClick={() => toggleRole.mutate({ userId: u.id, role: role.value, hasRole: has })}
                          className={cn(
                            "px-2 py-0.5 text-xs font-semibold rounded-full border transition-all",
                            has
                              ? role.color
                              : "bg-muted/30 text-muted-foreground border-muted-foreground/20 opacity-40 hover:opacity-70"
                          )}
                          title={has ? `Remover ${role.label}` : `Tornar ${role.label}`}
                        >
                          {role.label}
                        </button>
                      );
                    })}
                    <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                      <Crown className="h-3 w-3 mr-1" />
                      {u.subscription?.status || "mestre"}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ==================== INVITE CODES SECTION ====================

function InviteCodesSection() {
  const queryClient = useQueryClient();
  const [newCode, setNewCode] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("50");

  const { data: codes, isLoading } = useQuery({
    queryKey: ["admin-invite-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createCode = useMutation({
    mutationFn: async () => {
      const code = newCode.trim().toUpperCase() || generateCode();
      const { error } = await supabase.from("registration_codes").insert({
        code,
        max_uses: parseInt(newMaxUses) || 50,
      });
      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      toast.success(`Código ${code} criado!`);
      setNewCode("");
      queryClient.invalidateQueries({ queryKey: ["admin-invite-codes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleCode = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("registration_codes")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invite-codes"] });
    },
  });

  const deleteCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("registration_codes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Código removido");
      queryClient.invalidateQueries({ queryKey: ["admin-invite-codes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  return (
    <div className="space-y-6">
      {/* Create new code */}
      <Card className="p-4 bg-white/5 border-white/10 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Criar Novo Código
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Código (vazio = gerado automaticamente)</Label>
            <Input
              placeholder="Ex: MEUCODIGO"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="font-mono uppercase tracking-widest"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Máx. usos</Label>
            <Input
              type="number"
              value={newMaxUses}
              onChange={(e) => setNewMaxUses(e.target.value)}
              min={1}
            />
          </div>
        </div>
        <Button
          onClick={() => createCode.mutate()}
          disabled={createCode.isPending}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar Código
        </Button>
      </Card>

      {/* Existing codes */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {codes?.map((code) => (
            <Card key={code.id} className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => copyCode(code.code)}
                    className="font-mono text-lg font-bold tracking-widest hover:text-solar-orange transition-colors"
                    title="Copiar"
                  >
                    {code.code}
                  </button>
                  <button onClick={() => copyCode(code.code)} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant={code.is_active ? "default" : "secondary"} className={
                    code.is_active ? "bg-cyan-blue/20 text-cyan-blue" : "bg-muted text-muted-foreground"
                  }>
                    {code.current_uses}/{code.max_uses ?? "∞"} usos
                  </Badge>

                  <Switch
                    checked={code.is_active ?? false}
                    onCheckedChange={(active) => toggleCode.mutate({ id: code.id, active })}
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-magenta-red"
                    onClick={() => deleteCode.mutate(code.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {codes?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum código de convite criado ainda.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
