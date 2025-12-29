import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Pencil, Trash2, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

interface Supporter {
  id: string;
  name: string;
  tier: string;
  message: string | null;
  is_visible: boolean;
  created_at: string;
}

const TIERS = [
  { value: "lendario", label: "Lendário (R$500+)" },
  { value: "mestre_epico", label: "Mestre Épico (R$200)" },
  { value: "mestre", label: "Mestre (R$100)" },
  { value: "heroi", label: "Herói (R$50)" },
  { value: "aldeao", label: "Aldeão (R$25)" },
  { value: "apoiador", label: "Apoiador (R$10)" },
];

export default function AdminSupporters() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupporter, setEditingSupporter] = useState<Supporter | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formTier, setFormTier] = useState("apoiador");
  const [formMessage, setFormMessage] = useState("");
  const [formVisible, setFormVisible] = useState(true);

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
      setLoading(false);
    }
    checkAdmin();
  }, [user]);

  // Fetch supporters (admin can see all, including hidden)
  useEffect(() => {
    async function fetchSupporters() {
      if (!isAdmin) return;

      const { data, error } = await supabase
        .from("catarse_supporters")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSupporters(data);
      }
    }
    fetchSupporters();
  }, [isAdmin]);

  const resetForm = () => {
    setFormName("");
    setFormTier("apoiador");
    setFormMessage("");
    setFormVisible(true);
    setEditingSupporter(null);
  };

  const openEditDialog = (supporter: Supporter) => {
    setEditingSupporter(supporter);
    setFormName(supporter.name);
    setFormTier(supporter.tier);
    setFormMessage(supporter.message || "");
    setFormVisible(supporter.is_visible);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);

    try {
      if (editingSupporter) {
        // Update
        const { error } = await supabase
          .from("catarse_supporters")
          .update({
            name: formName.trim(),
            tier: formTier,
            message: formMessage.trim() || null,
            is_visible: formVisible,
          })
          .eq("id", editingSupporter.id);

        if (error) throw error;

        setSupporters((prev) =>
          prev.map((s) =>
            s.id === editingSupporter.id
              ? { ...s, name: formName.trim(), tier: formTier, message: formMessage.trim() || null, is_visible: formVisible }
              : s
          )
        );
        toast.success("Apoiador atualizado!");
      } else {
        // Insert
        const { data, error } = await supabase
          .from("catarse_supporters")
          .insert({
            name: formName.trim(),
            tier: formTier,
            message: formMessage.trim() || null,
            is_visible: formVisible,
          })
          .select()
          .single();

        if (error) throw error;

        setSupporters((prev) => [data, ...prev]);
        toast.success("Apoiador adicionado!");
      }

      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving supporter:", error);
      toast.error(error.message || "Erro ao salvar apoiador");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este apoiador?")) return;

    try {
      const { error } = await supabase
        .from("catarse_supporters")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSupporters((prev) => prev.filter((s) => s.id !== id));
      toast.success("Apoiador removido!");
    } catch (error: any) {
      console.error("Error deleting supporter:", error);
      toast.error(error.message || "Erro ao remover apoiador");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground text-center">
          Você precisa estar logado para acessar esta página.
        </p>
        <Button onClick={() => navigate("/auth")}>Fazer Login</Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <Shield className="h-16 w-16 text-destructive" />
        <h1 className="text-xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground text-center">
          Você não tem permissão para acessar esta página.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Voltar ao Início
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin - Apoiadores | Go20</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-bold">Admin - Apoiadores</h1>
            </div>

            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSupporter ? "Editar Apoiador" : "Novo Apoiador"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Nome do apoiador"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tier">Tier</Label>
                    <Select value={formTier} onValueChange={setFormTier}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIERS.map((tier) => (
                          <SelectItem key={tier.value} value={tier.value}>
                            {tier.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem (opcional)</Label>
                    <Textarea
                      id="message"
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      placeholder="Mensagem do apoiador"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="visible">Visível na página</Label>
                    <Switch
                      id="visible"
                      checked={formVisible}
                      onCheckedChange={setFormVisible}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : editingSupporter ? (
                        "Salvar"
                      ) : (
                        "Adicionar"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="container px-4 py-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-2xl font-bold">{supporters.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-2xl font-bold">
                {supporters.filter((s) => s.is_visible).length}
              </p>
              <p className="text-sm text-muted-foreground">Visíveis</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border col-span-2 sm:col-span-1">
              <p className="text-2xl font-bold">
                {supporters.filter((s) => s.tier === "lendario" || s.tier === "mestre_epico").length}
              </p>
              <p className="text-sm text-muted-foreground">VIPs</p>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="hidden sm:table-cell">Mensagem</TableHead>
                  <TableHead>Visível</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supporters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum apoiador cadastrado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  supporters.map((supporter) => (
                    <TableRow key={supporter.id}>
                      <TableCell className="font-medium">{supporter.name}</TableCell>
                      <TableCell>
                        <span className="capitalize text-sm">
                          {TIERS.find((t) => t.value === supporter.tier)?.label.split(" ")[0] || supporter.tier}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {supporter.message || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={supporter.is_visible ? "text-emerald-500" : "text-muted-foreground"}>
                          {supporter.is_visible ? "Sim" : "Não"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(supporter)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(supporter.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </>
  );
}