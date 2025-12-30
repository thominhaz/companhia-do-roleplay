import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Pencil, Trash2, Loader2, Users, Sword, Star, User, Inbox, Check, X, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SupporterNPC, SupporterItem, tierConfig, rarityConfig } from "@/hooks/useSupporterContent";

interface Supporter {
  id: string;
  name: string;
  tier: string;
  message: string | null;
  is_visible: boolean;
  created_at: string;
}

interface Submission {
  id: string;
  promo_code: string;
  submission_type: "npc" | "item";
  status: "pending" | "approved" | "rejected";
  creator_name: string;
  creator_tier: string;
  creator_message: string | null;
  email: string | null;
  data: Record<string, any>;
  admin_notes: string | null;
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

interface AdminSupportersSectionProps {
  section: "supporters" | "items" | "npcs" | "submissions";
}

export default function AdminSupportersSection({ section }: AdminSupportersSectionProps) {
  // Submissions state
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

  // Fetch data based on section
  useEffect(() => {
    async function fetchData() {
      if (section === "submissions") {
        const { data } = await supabase
          .from("supporter_submissions")
          .select("*")
          .order("created_at", { ascending: false });
        if (data) setSubmissions(data as Submission[]);
      } else if (section === "supporters") {
        const { data } = await supabase
          .from("catarse_supporters")
          .select("*")
          .order("created_at", { ascending: false });
        if (data) setSupporters(data);
      } else if (section === "npcs") {
        const { data } = await supabase
          .from("supporter_npcs")
          .select("*")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });
        if (data) setNpcs(data as SupporterNPC[]);
      } else if (section === "items") {
        const { data } = await supabase
          .from("supporter_items")
          .select("*")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false });
        if (data) setItems(data as SupporterItem[]);
      }
    }
    fetchData();
  }, [section]);

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

  // Submission functions
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
      toast.error(error.message || "Erro ao rejeitar submissão");
    } finally {
      setProcessingSubmission(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta submissão?")) return;

    try {
      const { error } = await supabase
        .from("supporter_submissions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Submissão excluída!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir submissão");
    }
  };

  // Render based on section
  if (section === "submissions") {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
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
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => openReviewDialog(submission)}
                  >
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSubmission(submission.id)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">
                    <strong>Criador:</strong> {selectedSubmission.creator_name} ({selectedSubmission.creator_tier})
                  </p>
                  <p className="text-sm">
                    <strong>Código:</strong> {selectedSubmission.promo_code}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Dados da Submissão</h4>
                  <div className="p-3 rounded-lg border text-sm space-y-1">
                    {Object.entries(selectedSubmission.data).map(([key, value]) => (
                      <p key={key}>
                        <strong>{key}:</strong> {String(value) || "-"}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas do Admin</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Notas internas"
                    rows={2}
                  />
                </div>

                {selectedSubmission.status === "pending" && (
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
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (section === "supporters") {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
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
                  <Label>Nome *</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nome do apoiador"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tier</Label>
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
                  <Label>Mensagem</Label>
                  <Textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="Mensagem do apoiador"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Visível na página</Label>
                  <Switch
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
                    {savingSupporter ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-2xl font-bold">{supporters.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-2xl font-bold">
              {supporters.filter((s) => s.is_visible).length}
            </p>
            <p className="text-sm text-muted-foreground">Visíveis</p>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <p className="text-2xl font-bold">
              {supporters.filter((s) => s.tier === "lendario" || s.tier === "mestre_epico").length}
            </p>
            <p className="text-sm text-muted-foreground">VIPs</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden">
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
      </div>
    );
  }

  if (section === "npcs") {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
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
                <DialogTitle>{editingNpc ? "Editar NPC" : "Novo NPC"}</DialogTitle>
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
                      placeholder="Ex: O Sábio"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={npcDescription}
                    onChange={(e) => setNpcDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ocupação</Label>
                    <Input
                      value={npcOccupation}
                      onChange={(e) => setNpcOccupation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Localização</Label>
                    <Input
                      value={npcLocation}
                      onChange={(e) => setNpcLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Aparência</Label>
                  <Textarea
                    value={npcAppearance}
                    onChange={(e) => setNpcAppearance(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Personalidade</Label>
                  <Textarea
                    value={npcPersonality}
                    onChange={(e) => setNpcPersonality(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>História</Label>
                  <Textarea
                    value={npcBackstory}
                    onChange={(e) => setNpcBackstory(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL da Imagem</Label>
                  <Input
                    value={npcImageUrl}
                    onChange={(e) => setNpcImageUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags (separadas por vírgula)</Label>
                  <Input
                    value={npcTags}
                    onChange={(e) => setNpcTags(e.target.value)}
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
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tier</Label>
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
                </div>

                <div className="flex items-center justify-between">
                  <Label>Visível</Label>
                  <Switch checked={npcVisible} onCheckedChange={setNpcVisible} />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Destaque</Label>
                  <Switch checked={npcFeatured} onCheckedChange={setNpcFeatured} />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setNpcDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={savingNpc}>
                    {savingNpc ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* NPCs Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {npcs.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum NPC cadastrado ainda.</p>
            </div>
          ) : (
            npcs.map((npc) => (
              <div key={npc.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{npc.name}</h4>
                      {npc.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    {npc.title && <p className="text-sm text-muted-foreground">{npc.title}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      Por: {npc.creator_name}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toggleNpcFeatured(npc)}>
                      <Star className={`h-4 w-4 ${npc.is_featured ? "text-yellow-500 fill-yellow-500" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditNpcDialog(npc)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteNpc(npc.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (section === "items") {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Itens de Apoiadores</h2>
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
                <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleItemSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Raridade</Label>
                    <Select value={itemRarity} onValueChange={setItemRarity}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RARITIES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={itemType} onValueChange={setItemType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Requer Sintonização</Label>
                  <Switch checked={itemRequiresAttunement} onCheckedChange={setItemRequiresAttunement} />
                </div>

                {itemRequiresAttunement && (
                  <div className="space-y-2">
                    <Label>Requisitos de Sintonização</Label>
                    <Input
                      value={itemAttunementReqs}
                      onChange={(e) => setItemAttunementReqs(e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dano</Label>
                    <Input
                      value={itemDamage}
                      onChange={(e) => setItemDamage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Dano</Label>
                    <Input
                      value={itemDamageType}
                      onChange={(e) => setItemDamageType(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>URL da Imagem</Label>
                  <Input
                    value={itemImageUrl}
                    onChange={(e) => setItemImageUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags (separadas por vírgula)</Label>
                  <Input
                    value={itemTags}
                    onChange={(e) => setItemTags(e.target.value)}
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
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tier</Label>
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
                </div>

                <div className="flex items-center justify-between">
                  <Label>Visível</Label>
                  <Switch checked={itemVisible} onCheckedChange={setItemVisible} />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Destaque</Label>
                  <Switch checked={itemFeatured} onCheckedChange={setItemFeatured} />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setItemDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={savingItem}>
                    {savingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Items Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {items.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Sword className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum item cadastrado ainda.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{item.name}</h4>
                      {item.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {RARITIES.find(r => r.value === item.rarity)?.label || item.rarity}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {ITEM_TYPES.find(t => t.value === item.item_type)?.label || item.item_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Por: {item.creator_name}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toggleItemFeatured(item)}>
                      <Star className={`h-4 w-4 ${item.is_featured ? "text-yellow-500 fill-yellow-500" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditItemDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return null;
}
