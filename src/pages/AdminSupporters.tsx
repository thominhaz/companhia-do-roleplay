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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Pencil, Trash2, Shield, Loader2, Users, Sword, Star, User, FileText, Inbox, Check, X, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Helmet } from "react-helmet";
import { SupporterNPC, SupporterItem, tierConfig, rarityConfig } from "@/hooks/useSupporterContent";

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

const CREATOR_TIERS = [
  { value: "lendario", label: "Lendário" },
  { value: "mestre_epico", label: "Mestre Épico" },
];

const RARITIES = [
  { value: "comum", label: "Comum" },
  { value: "incomum", label: "Incomum" },
  { value: "raro", label: "Raro" },
  { value: "muito_raro", label: "Muito Raro" },
  { value: "lendario", label: "Lendário" },
  { value: "artefato", label: "Artefato" },
];

const ITEM_TYPES = [
  { value: "weapon", label: "Arma" },
  { value: "armor", label: "Armadura" },
  { value: "wondrous", label: "Item Maravilhoso" },
  { value: "potion", label: "Poção" },
  { value: "ring", label: "Anel" },
  { value: "rod", label: "Bastão" },
  { value: "scroll", label: "Pergaminho" },
  { value: "staff", label: "Cajado" },
  { value: "wand", label: "Varinha" },
];

export default function AdminSupporters() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("submissions");

  // Submissions state
  interface Submission {
    id: string;
    promo_code: string;
    submission_type: "npc" | "item";
    status: "pending" | "approved" | "rejected";
    creator_name: string;
    creator_tier: string;
    creator_message: string | null;
    data: Record<string, any>;
    admin_notes: string | null;
    created_at: string;
  }
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [processingSubmission, setProcessingSubmission] = useState(false);

  // Supporters state
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [supporterDialogOpen, setSupporterDialogOpen] = useState(false);
  const [editingSupporter, setEditingSupporter] = useState<Supporter | null>(null);
  const [savingSupporter, setSavingSupporter] = useState(false);

  // NPCs state
  const [npcs, setNpcs] = useState<SupporterNPC[]>([]);
  const [npcDialogOpen, setNpcDialogOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<SupporterNPC | null>(null);
  const [savingNpc, setSavingNpc] = useState(false);

  // Items state
  const [items, setItems] = useState<SupporterItem[]>([]);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupporterItem | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // Supporter form state
  const [formName, setFormName] = useState("");
  const [formTier, setFormTier] = useState("apoiador");
  const [formMessage, setFormMessage] = useState("");
  const [formVisible, setFormVisible] = useState(true);

  // NPC form state
  const [npcName, setNpcName] = useState("");
  const [npcTitle, setNpcTitle] = useState("");
  const [npcDescription, setNpcDescription] = useState("");
  const [npcAppearance, setNpcAppearance] = useState("");
  const [npcPersonality, setNpcPersonality] = useState("");
  const [npcBackstory, setNpcBackstory] = useState("");
  const [npcOccupation, setNpcOccupation] = useState("");
  const [npcLocation, setNpcLocation] = useState("");
  const [npcImageUrl, setNpcImageUrl] = useState("");
  const [npcCreatorName, setNpcCreatorName] = useState("");
  const [npcCreatorTier, setNpcCreatorTier] = useState("lendario");
  const [npcCreatorMessage, setNpcCreatorMessage] = useState("");
  const [npcVisible, setNpcVisible] = useState(true);
  const [npcFeatured, setNpcFeatured] = useState(false);
  const [npcTags, setNpcTags] = useState("");

  // Item form state
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemRarity, setItemRarity] = useState("raro");
  const [itemType, setItemType] = useState("wondrous");
  const [itemRequiresAttunement, setItemRequiresAttunement] = useState(false);
  const [itemAttunementReqs, setItemAttunementReqs] = useState("");
  const [itemProperties, setItemProperties] = useState("");
  const [itemDamage, setItemDamage] = useState("");
  const [itemDamageType, setItemDamageType] = useState("");
  const [itemAcBonus, setItemAcBonus] = useState("");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemCreatorName, setItemCreatorName] = useState("");
  const [itemCreatorTier, setItemCreatorTier] = useState("lendario");
  const [itemCreatorMessage, setItemCreatorMessage] = useState("");
  const [itemVisible, setItemVisible] = useState(true);
  const [itemFeatured, setItemFeatured] = useState(false);
  const [itemTags, setItemTags] = useState("");

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

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      if (!isAdmin) return;

      // Fetch submissions
      const { data: submissionsData } = await supabase
        .from("supporter_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (submissionsData) setSubmissions(submissionsData as Submission[]);

      // Fetch supporters
      const { data: supportersData } = await supabase
        .from("catarse_supporters")
        .select("*")
        .order("created_at", { ascending: false });
      if (supportersData) setSupporters(supportersData);

      // Fetch NPCs
      const { data: npcsData } = await supabase
        .from("supporter_npcs")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (npcsData) setNpcs(npcsData as SupporterNPC[]);

      // Fetch Items
      const { data: itemsData } = await supabase
        .from("supporter_items")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (itemsData) setItems(itemsData as SupporterItem[]);
    }
    fetchData();
  }, [isAdmin]);

  // Submission review functions
  const openReviewDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.admin_notes || "");
    setReviewDialogOpen(true);
  };

  const handleApproveSubmission = async () => {
    if (!selectedSubmission) return;
    setProcessingSubmission(true);

    try {
      const data = selectedSubmission.data;
      
      if (selectedSubmission.submission_type === "npc") {
        // Create NPC
        const { error: npcError } = await supabase.from("supporter_npcs").insert({
          name: data.name,
          title: data.title,
          description: data.description,
          appearance: data.appearance,
          personality: data.personality,
          backstory: data.backstory,
          occupation: data.occupation,
          location: data.location,
          image_url: data.image_url,
          tags: data.tags,
          creator_name: selectedSubmission.creator_name,
          creator_tier: selectedSubmission.creator_tier,
          creator_message: selectedSubmission.creator_message,
          is_visible: true,
          is_featured: false,
        });
        if (npcError) throw npcError;
      } else {
        // Create Item
        const { error: itemError } = await supabase.from("supporter_items").insert({
          name: data.name,
          description: data.description,
          rarity: data.rarity,
          item_type: data.item_type,
          requires_attunement: data.requires_attunement,
          attunement_requirements: data.attunement_requirements,
          properties: data.properties,
          damage: data.damage,
          damage_type: data.damage_type,
          ac_bonus: data.ac_bonus,
          image_url: data.image_url,
          tags: data.tags,
          creator_name: selectedSubmission.creator_name,
          creator_tier: selectedSubmission.creator_tier,
          creator_message: selectedSubmission.creator_message,
          is_visible: true,
          is_featured: false,
        });
        if (itemError) throw itemError;
      }

      // Update submission status
      const { error: updateError } = await supabase
        .from("supporter_submissions")
        .update({
          status: "approved",
          admin_notes: adminNotes.trim() || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedSubmission.id);

      if (updateError) throw updateError;

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmission.id ? { ...s, status: "approved" as const, admin_notes: adminNotes.trim() || null } : s
        )
      );

      toast.success("Submissão aprovada e conteúdo criado!");
      setReviewDialogOpen(false);
      setSelectedSubmission(null);
    } catch (error: any) {
      console.error("Error approving submission:", error);
      toast.error(error.message || "Erro ao aprovar submissão");
    } finally {
      setProcessingSubmission(false);
    }
  };

  const handleRejectSubmission = async () => {
    if (!selectedSubmission) return;
    setProcessingSubmission(true);

    try {
      const { error } = await supabase
        .from("supporter_submissions")
        .update({
          status: "rejected",
          admin_notes: adminNotes.trim() || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedSubmission.id);

      if (error) throw error;

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmission.id ? { ...s, status: "rejected" as const, admin_notes: adminNotes.trim() || null } : s
        )
      );

      toast.success("Submissão rejeitada");
      setReviewDialogOpen(false);
      setSelectedSubmission(null);
    } catch (error: any) {
      console.error("Error rejecting submission:", error);
      toast.error(error.message || "Erro ao rejeitar submissão");
    } finally {
      setProcessingSubmission(false);
    }
  };

  // Supporter functions
  const resetSupporterForm = () => {
    setFormName("");
    setFormTier("apoiador");
    setFormMessage("");
    setFormVisible(true);
    setEditingSupporter(null);
  };

  const openEditSupporterDialog = (supporter: Supporter) => {
    setEditingSupporter(supporter);
    setFormName(supporter.name);
    setFormTier(supporter.tier);
    setFormMessage(supporter.message || "");
    setFormVisible(supporter.is_visible);
    setSupporterDialogOpen(true);
  };

  const handleSupporterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSavingSupporter(true);

    try {
      if (editingSupporter) {
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

      setSupporterDialogOpen(false);
      resetSupporterForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar apoiador");
    } finally {
      setSavingSupporter(false);
    }
  };

  const handleDeleteSupporter = async (id: string) => {
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
      toast.error(error.message || "Erro ao remover apoiador");
    }
  };

  // NPC functions
  const resetNpcForm = () => {
    setNpcName("");
    setNpcTitle("");
    setNpcDescription("");
    setNpcAppearance("");
    setNpcPersonality("");
    setNpcBackstory("");
    setNpcOccupation("");
    setNpcLocation("");
    setNpcImageUrl("");
    setNpcCreatorName("");
    setNpcCreatorTier("lendario");
    setNpcCreatorMessage("");
    setNpcVisible(true);
    setNpcFeatured(false);
    setNpcTags("");
    setEditingNpc(null);
  };

  const openEditNpcDialog = (npc: SupporterNPC) => {
    setEditingNpc(npc);
    setNpcName(npc.name);
    setNpcTitle(npc.title || "");
    setNpcDescription(npc.description || "");
    setNpcAppearance(npc.appearance || "");
    setNpcPersonality(npc.personality || "");
    setNpcBackstory(npc.backstory || "");
    setNpcOccupation(npc.occupation || "");
    setNpcLocation(npc.location || "");
    setNpcImageUrl(npc.image_url || "");
    setNpcCreatorName(npc.creator_name);
    setNpcCreatorTier(npc.creator_tier);
    setNpcCreatorMessage(npc.creator_message || "");
    setNpcVisible(npc.is_visible);
    setNpcFeatured(npc.is_featured);
    setNpcTags(npc.tags?.join(", ") || "");
    setNpcDialogOpen(true);
  };

  const handleNpcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npcName.trim() || !npcCreatorName.trim()) {
      toast.error("Nome e criador são obrigatórios");
      return;
    }

    setSavingNpc(true);

    const npcData = {
      name: npcName.trim(),
      title: npcTitle.trim() || null,
      description: npcDescription.trim() || null,
      appearance: npcAppearance.trim() || null,
      personality: npcPersonality.trim() || null,
      backstory: npcBackstory.trim() || null,
      occupation: npcOccupation.trim() || null,
      location: npcLocation.trim() || null,
      image_url: npcImageUrl.trim() || null,
      creator_name: npcCreatorName.trim(),
      creator_tier: npcCreatorTier,
      creator_message: npcCreatorMessage.trim() || null,
      is_visible: npcVisible,
      is_featured: npcFeatured,
      tags: npcTags.trim() ? npcTags.split(",").map(t => t.trim()).filter(Boolean) : null,
    };

    try {
      if (editingNpc) {
        const { error } = await supabase
          .from("supporter_npcs")
          .update(npcData)
          .eq("id", editingNpc.id);

        if (error) throw error;

        setNpcs((prev) =>
          prev.map((n) =>
            n.id === editingNpc.id ? { ...n, ...npcData } as SupporterNPC : n
          )
        );
        toast.success("NPC atualizado!");
      } else {
        const { data, error } = await supabase
          .from("supporter_npcs")
          .insert(npcData)
          .select()
          .single();

        if (error) throw error;
        setNpcs((prev) => [data as SupporterNPC, ...prev]);
        toast.success("NPC adicionado!");
      }

      setNpcDialogOpen(false);
      resetNpcForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar NPC");
    } finally {
      setSavingNpc(false);
    }
  };

  const handleDeleteNpc = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este NPC?")) return;

    try {
      const { error } = await supabase
        .from("supporter_npcs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setNpcs((prev) => prev.filter((n) => n.id !== id));
      toast.success("NPC removido!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover NPC");
    }
  };

  const toggleNpcFeatured = async (npc: SupporterNPC) => {
    try {
      const { error } = await supabase
        .from("supporter_npcs")
        .update({ is_featured: !npc.is_featured })
        .eq("id", npc.id);

      if (error) throw error;
      setNpcs((prev) =>
        prev.map((n) =>
          n.id === npc.id ? { ...n, is_featured: !n.is_featured } : n
        )
      );
      toast.success(npc.is_featured ? "NPC removido dos destaques" : "NPC destacado!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar NPC");
    }
  };

  // Item functions
  const resetItemForm = () => {
    setItemName("");
    setItemDescription("");
    setItemRarity("raro");
    setItemType("wondrous");
    setItemRequiresAttunement(false);
    setItemAttunementReqs("");
    setItemProperties("");
    setItemDamage("");
    setItemDamageType("");
    setItemAcBonus("");
    setItemImageUrl("");
    setItemCreatorName("");
    setItemCreatorTier("lendario");
    setItemCreatorMessage("");
    setItemVisible(true);
    setItemFeatured(false);
    setItemTags("");
    setEditingItem(null);
  };

  const openEditItemDialog = (item: SupporterItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description || "");
    setItemRarity(item.rarity);
    setItemType(item.item_type);
    setItemRequiresAttunement(item.requires_attunement);
    setItemAttunementReqs(item.attunement_requirements || "");
    setItemProperties(item.properties || "");
    setItemDamage(item.damage || "");
    setItemDamageType(item.damage_type || "");
    setItemAcBonus(item.ac_bonus?.toString() || "");
    setItemImageUrl(item.image_url || "");
    setItemCreatorName(item.creator_name);
    setItemCreatorTier(item.creator_tier);
    setItemCreatorMessage(item.creator_message || "");
    setItemVisible(item.is_visible);
    setItemFeatured(item.is_featured);
    setItemTags(item.tags?.join(", ") || "");
    setItemDialogOpen(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemCreatorName.trim()) {
      toast.error("Nome e criador são obrigatórios");
      return;
    }

    setSavingItem(true);

    const itemData = {
      name: itemName.trim(),
      description: itemDescription.trim() || null,
      rarity: itemRarity,
      item_type: itemType,
      requires_attunement: itemRequiresAttunement,
      attunement_requirements: itemAttunementReqs.trim() || null,
      properties: itemProperties.trim() || null,
      damage: itemDamage.trim() || null,
      damage_type: itemDamageType.trim() || null,
      ac_bonus: itemAcBonus ? parseInt(itemAcBonus) : null,
      image_url: itemImageUrl.trim() || null,
      creator_name: itemCreatorName.trim(),
      creator_tier: itemCreatorTier,
      creator_message: itemCreatorMessage.trim() || null,
      is_visible: itemVisible,
      is_featured: itemFeatured,
      tags: itemTags.trim() ? itemTags.split(",").map(t => t.trim()).filter(Boolean) : null,
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("supporter_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;

        setItems((prev) =>
          prev.map((i) =>
            i.id === editingItem.id ? { ...i, ...itemData } as SupporterItem : i
          )
        );
        toast.success("Item atualizado!");
      } else {
        const { data, error } = await supabase
          .from("supporter_items")
          .insert(itemData)
          .select()
          .single();

        if (error) throw error;
        setItems((prev) => [data as SupporterItem, ...prev]);
        toast.success("Item adicionado!");
      }

      setItemDialogOpen(false);
      resetItemForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar item");
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return;

    try {
      const { error } = await supabase
        .from("supporter_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item removido!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover item");
    }
  };

  const toggleItemFeatured = async (item: SupporterItem) => {
    try {
      const { error } = await supabase
        .from("supporter_items")
        .update({ is_featured: !item.is_featured })
        .eq("id", item.id);

      if (error) throw error;
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_featured: !i.is_featured } : i
        )
      );
      toast.success(item.is_featured ? "Item removido dos destaques" : "Item destacado!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar item");
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
              <h1 className="text-lg font-bold">Admin - Galeria de Apoiadores</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/apoiadores/formularios")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Formulários</span>
            </Button>
          </div>
        </header>

        <main className="container px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="submissions" className="flex-1 gap-2">
                <Inbox className="h-4 w-4" />
                <span className="hidden sm:inline">Submissões</span>
              </TabsTrigger>
              <TabsTrigger value="supporters" className="flex-1 gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Apoiadores</span>
              </TabsTrigger>
              <TabsTrigger value="npcs" className="flex-1 gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">NPCs</span>
              </TabsTrigger>
              <TabsTrigger value="items" className="flex-1 gap-2">
                <Sword className="h-4 w-4" />
                <span className="hidden sm:inline">Itens</span>
              </TabsTrigger>
            </TabsList>

            {/* Submissions Tab */}
            <TabsContent value="submissions">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Submissões Pendentes</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `${window.location.origin}/apoiadores/submeter`;
                    navigator.clipboard.writeText(url);
                    toast.success("Link copiado!");
                  }}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Copiar Link
                </Button>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma submissão ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => openReviewDialog(submission)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {submission.submission_type === "npc" ? (
                              <User className="h-4 w-4 text-primary" />
                            ) : (
                              <Sword className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="font-medium truncate">
                              {submission.data.name || "Sem nome"}
                            </span>
                            <Badge
                              variant={
                                submission.status === "pending"
                                  ? "secondary"
                                  : submission.status === "approved"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {submission.status === "pending"
                                ? "Pendente"
                                : submission.status === "approved"
                                ? "Aprovado"
                                : "Rejeitado"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Por: <span className="font-medium">{submission.creator_name}</span> ({submission.creator_tier})
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Código: {submission.promo_code} • {new Date(submission.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Review Dialog */}
              <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Revisar {selectedSubmission?.submission_type === "npc" ? "NPC" : "Item"}
                    </DialogTitle>
                  </DialogHeader>

                  {selectedSubmission && (
                    <div className="space-y-4">
                      {/* Creator Info */}
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm">
                          <strong>Criador:</strong> {selectedSubmission.creator_name} ({selectedSubmission.creator_tier})
                        </p>
                        <p className="text-sm">
                          <strong>Código:</strong> {selectedSubmission.promo_code}
                        </p>
                        {selectedSubmission.creator_message && (
                          <p className="text-sm mt-2">
                            <strong>Mensagem:</strong> {selectedSubmission.creator_message}
                          </p>
                        )}
                      </div>

                      {/* Submission Data */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Dados da Submissão</h4>
                        <div className="p-3 rounded-lg border space-y-2 text-sm">
                          {Object.entries(selectedSubmission.data).map(([key, value]) => {
                            if (!value) return null;
                            const formattedKey = key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
                            return (
                              <div key={key}>
                                <strong>{formattedKey}:</strong>{" "}
                                {Array.isArray(value) ? value.join(", ") : String(value)}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Admin Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="admin-notes">Notas do Admin (opcional)</Label>
                        <Textarea
                          id="admin-notes"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Notas internas sobre a submissão"
                          rows={2}
                        />
                      </div>

                      {/* Action Buttons */}
                      {selectedSubmission.status === "pending" ? (
                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="destructive"
                            onClick={handleRejectSubmission}
                            disabled={processingSubmission}
                            className="flex-1 gap-2"
                          >
                            <X className="h-4 w-4" />
                            Rejeitar
                          </Button>
                          <Button
                            onClick={handleApproveSubmission}
                            disabled={processingSubmission}
                            className="flex-1 gap-2"
                          >
                            {processingSubmission ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Aprovar
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <Badge
                            variant={selectedSubmission.status === "approved" ? "default" : "destructive"}
                          >
                            {selectedSubmission.status === "approved" ? "Aprovado" : "Rejeitado"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Supporters Tab */}
            <TabsContent value="supporters">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Apoiadores Catarse</h2>
                <Dialog open={supporterDialogOpen} onOpenChange={(open) => {
                  setSupporterDialogOpen(open);
                  if (!open) resetSupporterForm();
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
                    <form onSubmit={handleSupporterSubmit} className="space-y-4">
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
                            setSupporterDialogOpen(false);
                            resetSupporterForm();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={savingSupporter}>
                          {savingSupporter ? (
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

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
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
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-2xl font-bold">
                    {supporters.filter((s) => s.tier === "lendario" || s.tier === "mestre_epico").length}
                  </p>
                  <p className="text-sm text-muted-foreground">VIPs</p>
                </div>
              </div>

              {/* Supporters Table */}
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
                                onClick={() => openEditSupporterDialog(supporter)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSupporter(supporter.id)}
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
            </TabsContent>

            {/* NPCs Tab */}
            <TabsContent value="npcs">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">NPCs de Apoiadores</h2>
                <Dialog open={npcDialogOpen} onOpenChange={(open) => {
                  setNpcDialogOpen(open);
                  if (!open) resetNpcForm();
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar NPC
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingNpc ? "Editar NPC" : "Novo NPC"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleNpcSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input
                            value={npcName}
                            onChange={(e) => setNpcName(e.target.value)}
                            placeholder="Nome do NPC"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Título</Label>
                          <Input
                            value={npcTitle}
                            onChange={(e) => setNpcTitle(e.target.value)}
                            placeholder="Ex: O Sábio da Montanha"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={npcDescription}
                          onChange={(e) => setNpcDescription(e.target.value)}
                          placeholder="Breve descrição do NPC"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ocupação</Label>
                          <Input
                            value={npcOccupation}
                            onChange={(e) => setNpcOccupation(e.target.value)}
                            placeholder="Ex: Ferreiro, Mago"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Localização</Label>
                          <Input
                            value={npcLocation}
                            onChange={(e) => setNpcLocation(e.target.value)}
                            placeholder="Ex: Vila de Riverside"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Aparência</Label>
                        <Textarea
                          value={npcAppearance}
                          onChange={(e) => setNpcAppearance(e.target.value)}
                          placeholder="Descrição física do NPC"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Personalidade</Label>
                        <Textarea
                          value={npcPersonality}
                          onChange={(e) => setNpcPersonality(e.target.value)}
                          placeholder="Traços de personalidade"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>História</Label>
                        <Textarea
                          value={npcBackstory}
                          onChange={(e) => setNpcBackstory(e.target.value)}
                          placeholder="História de fundo do NPC"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>URL da Imagem</Label>
                        <Input
                          value={npcImageUrl}
                          onChange={(e) => setNpcImageUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tags (separadas por vírgula)</Label>
                        <Input
                          value={npcTags}
                          onChange={(e) => setNpcTags(e.target.value)}
                          placeholder="aliado, mago, misterioso"
                        />
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Informações do Criador</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nome do Criador *</Label>
                            <Input
                              value={npcCreatorName}
                              onChange={(e) => setNpcCreatorName(e.target.value)}
                              placeholder="Nome do apoiador"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tier do Criador</Label>
                            <Select value={npcCreatorTier} onValueChange={setNpcCreatorTier}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CREATOR_TIERS.map((tier) => (
                                  <SelectItem key={tier.value} value={tier.value}>
                                    {tier.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2 mt-4">
                          <Label>Mensagem do Criador</Label>
                          <Textarea
                            value={npcCreatorMessage}
                            onChange={(e) => setNpcCreatorMessage(e.target.value)}
                            placeholder="Mensagem opcional do criador"
                            rows={2}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={npcVisible}
                              onCheckedChange={setNpcVisible}
                            />
                            <Label>Visível</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={npcFeatured}
                              onCheckedChange={setNpcFeatured}
                            />
                            <Label>Destacado</Label>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setNpcDialogOpen(false);
                            resetNpcForm();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={savingNpc}>
                          {savingNpc ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : editingNpc ? (
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

              {/* NPC Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-2xl font-bold">{npcs.length}</p>
                  <p className="text-sm text-muted-foreground">Total NPCs</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-2xl font-bold">
                    {npcs.filter((n) => n.is_featured).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Destacados</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-2xl font-bold">
                    {npcs.filter((n) => n.is_visible).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Visíveis</p>
                </div>
              </div>

              {/* NPCs Table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NPC</TableHead>
                      <TableHead>Criador</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {npcs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum NPC cadastrado ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      npcs.map((npc) => (
                        <TableRow key={npc.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {npc.image_url ? (
                                <img
                                  src={npc.image_url}
                                  alt={npc.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{npc.name}</p>
                                {npc.title && (
                                  <p className="text-sm text-muted-foreground">{npc.title}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{npc.creator_name}</p>
                              <p className={`text-xs ${tierConfig[npc.creator_tier as keyof typeof tierConfig]?.textColor || 'text-muted-foreground'}`}>
                                {tierConfig[npc.creator_tier as keyof typeof tierConfig]?.label || npc.creator_tier}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {npc.is_featured && (
                                <span className="text-xs text-amber-500 flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-current" /> Destacado
                                </span>
                              )}
                              <span className={npc.is_visible ? "text-xs text-emerald-500" : "text-xs text-muted-foreground"}>
                                {npc.is_visible ? "Visível" : "Oculto"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleNpcFeatured(npc)}
                                className={npc.is_featured ? "text-amber-500" : ""}
                              >
                                <Star className={`h-4 w-4 ${npc.is_featured ? "fill-current" : ""}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditNpcDialog(npc)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteNpc(npc.id)}
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
            </TabsContent>

            {/* Items Tab */}
            <TabsContent value="items">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Itens Mágicos de Apoiadores</h2>
                <Dialog open={itemDialogOpen} onOpenChange={(open) => {
                  setItemDialogOpen(open);
                  if (!open) resetItemForm();
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? "Editar Item" : "Novo Item Mágico"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleItemSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="Nome do item"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select value={itemType} onValueChange={setItemType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ITEM_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Raridade</Label>
                        <Select value={itemRarity} onValueChange={setItemRarity}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RARITIES.map((rarity) => (
                              <SelectItem key={rarity.value} value={rarity.value}>
                                {rarity.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={itemDescription}
                          onChange={(e) => setItemDescription(e.target.value)}
                          placeholder="Descrição detalhada do item e seus poderes"
                          rows={4}
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={itemRequiresAttunement}
                            onCheckedChange={setItemRequiresAttunement}
                          />
                          <Label>Requer Sintonização</Label>
                        </div>
                      </div>

                      {itemRequiresAttunement && (
                        <div className="space-y-2">
                          <Label>Requisitos de Sintonização</Label>
                          <Input
                            value={itemAttunementReqs}
                            onChange={(e) => setItemAttunementReqs(e.target.value)}
                            placeholder="Ex: por um conjurador"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Propriedades</Label>
                        <Input
                          value={itemProperties}
                          onChange={(e) => setItemProperties(e.target.value)}
                          placeholder="Ex: Versátil, Leve"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Dano</Label>
                          <Input
                            value={itemDamage}
                            onChange={(e) => setItemDamage(e.target.value)}
                            placeholder="Ex: 2d6"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo de Dano</Label>
                          <Input
                            value={itemDamageType}
                            onChange={(e) => setItemDamageType(e.target.value)}
                            placeholder="Ex: Cortante"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Bônus de CA</Label>
                          <Input
                            type="number"
                            value={itemAcBonus}
                            onChange={(e) => setItemAcBonus(e.target.value)}
                            placeholder="Ex: 2"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>URL da Imagem</Label>
                        <Input
                          value={itemImageUrl}
                          onChange={(e) => setItemImageUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tags (separadas por vírgula)</Label>
                        <Input
                          value={itemTags}
                          onChange={(e) => setItemTags(e.target.value)}
                          placeholder="espada, fogo, lendário"
                        />
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Informações do Criador</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nome do Criador *</Label>
                            <Input
                              value={itemCreatorName}
                              onChange={(e) => setItemCreatorName(e.target.value)}
                              placeholder="Nome do apoiador"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tier do Criador</Label>
                            <Select value={itemCreatorTier} onValueChange={setItemCreatorTier}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CREATOR_TIERS.map((tier) => (
                                  <SelectItem key={tier.value} value={tier.value}>
                                    {tier.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2 mt-4">
                          <Label>Mensagem do Criador</Label>
                          <Textarea
                            value={itemCreatorMessage}
                            onChange={(e) => setItemCreatorMessage(e.target.value)}
                            placeholder="Mensagem opcional do criador"
                            rows={2}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={itemVisible}
                              onCheckedChange={setItemVisible}
                            />
                            <Label>Visível</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={itemFeatured}
                              onCheckedChange={setItemFeatured}
                            />
                            <Label>Destacado</Label>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setItemDialogOpen(false);
                            resetItemForm();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={savingItem}>
                          {savingItem ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : editingItem ? (
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

              {/* Item Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-2xl font-bold">{items.length}</p>
                  <p className="text-sm text-muted-foreground">Total Itens</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-2xl font-bold">
                    {items.filter((i) => i.is_featured).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Destacados</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-2xl font-bold">
                    {items.filter((i) => i.is_visible).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Visíveis</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Raridade</TableHead>
                      <TableHead>Criador</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum item cadastrado ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                  <Sword className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {ITEM_TYPES.find(t => t.value === item.item_type)?.label || item.item_type}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm ${rarityConfig[item.rarity as keyof typeof rarityConfig]?.color || ''}`}>
                              {rarityConfig[item.rarity as keyof typeof rarityConfig]?.label || item.rarity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{item.creator_name}</p>
                              <p className={`text-xs ${tierConfig[item.creator_tier as keyof typeof tierConfig]?.textColor || 'text-muted-foreground'}`}>
                                {tierConfig[item.creator_tier as keyof typeof tierConfig]?.label || item.creator_tier}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {item.is_featured && (
                                <span className="text-xs text-amber-500 flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-current" /> Destacado
                                </span>
                              )}
                              <span className={item.is_visible ? "text-xs text-emerald-500" : "text-xs text-muted-foreground"}>
                                {item.is_visible ? "Visível" : "Oculto"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleItemFeatured(item)}
                                className={item.is_featured ? "text-amber-500" : ""}
                              >
                                <Star className={`h-4 w-4 ${item.is_featured ? "fill-current" : ""}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditItemDialog(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(item.id)}
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
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
