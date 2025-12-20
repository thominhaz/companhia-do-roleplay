import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCampaignNotes, useCreateNote, useUpdateNote, useDeleteNote, CampaignNote } from "@/hooks/useNotes";
import { useAuth } from "@/hooks/useAuth";
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Loader2, 
  Eye, 
  EyeOff,
  Save,
  ArrowLeft,
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CampaignNotesSheetProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignNotesSheet({ campaignId, open, onOpenChange }: CampaignNotesSheetProps) {
  const { user } = useAuth();
  const [selectedNote, setSelectedNote] = useState<CampaignNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "", is_public: false });

  const { data: notes, isLoading } = useCampaignNotes(campaignId);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const myNotes = notes?.filter(n => n.user_id === user?.id) || [];
  const publicNotes = notes?.filter(n => n.is_public && n.user_id !== user?.id) || [];

  const handleCreateNote = async () => {
    if (!editForm.title.trim()) return;

    await createNote.mutateAsync({
      campaign_id: campaignId,
      title: editForm.title,
      content: editForm.content,
      is_public: editForm.is_public,
    });

    setEditForm({ title: "", content: "", is_public: false });
    setIsCreating(false);
  };

  const handleUpdateNote = async () => {
    if (!selectedNote || !editForm.title.trim()) return;

    await updateNote.mutateAsync({
      id: selectedNote.id,
      campaignId,
      title: editForm.title,
      content: editForm.content,
      is_public: editForm.is_public,
    });

    setIsEditing(false);
    setSelectedNote(null);
  };

  const handleDeleteNote = async (note: CampaignNote) => {
    await deleteNote.mutateAsync({ id: note.id, campaignId });
    if (selectedNote?.id === note.id) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  const openNote = (note: CampaignNote) => {
    setSelectedNote(note);
    setEditForm({
      title: note.title,
      content: note.content || "",
      is_public: note.is_public,
    });
    setIsEditing(false);
  };

  const startEditing = () => {
    if (selectedNote) {
      setEditForm({
        title: selectedNote.title,
        content: selectedNote.content || "",
        is_public: selectedNote.is_public,
      });
      setIsEditing(true);
    }
  };

  const startCreating = () => {
    setEditForm({ title: "", content: "", is_public: false });
    setIsCreating(true);
    setSelectedNote(null);
    setIsEditing(false);
  };

  const goBack = () => {
    setSelectedNote(null);
    setIsEditing(false);
    setIsCreating(false);
  };

  // Note detail/edit view
  if (selectedNote || isCreating) {
    const isOwner = selectedNote?.user_id === user?.id;
    const canEdit = isOwner || isCreating;

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
          <SheetHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={goBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <SheetTitle className="text-xl">
                  {isCreating ? "Nova Nota" : (isEditing ? "Editar Nota" : selectedNote?.title)}
                </SheetTitle>
              </div>
              {canEdit && !isEditing && !isCreating && (
                <Button variant="ghost" size="icon" onClick={startEditing}>
                  <Edit className="w-5 h-5" />
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="p-6 space-y-4">
            {isEditing || isCreating ? (
              <>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título da nota..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Escreva sua nota aqui..."
                    className="min-h-[200px]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    {editForm.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <div>
                      <p className="text-sm font-medium">Nota pública</p>
                      <p className="text-xs text-muted-foreground">
                        {editForm.is_public ? "Visível para todos da campanha" : "Apenas você pode ver"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={editForm.is_public}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_public: checked }))}
                  />
                </div>

                <Button
                  onClick={isCreating ? handleCreateNote : handleUpdateNote}
                  disabled={!editForm.title.trim() || createNote.isPending || updateNote.isPending}
                  className="w-full"
                >
                  {(createNote.isPending || updateNote.isPending) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isCreating ? "Criar Nota" : "Salvar"}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {selectedNote?.is_public ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                  <span>{selectedNote?.is_public ? "Nota pública" : "Nota privada"}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(selectedNote?.updated_at || ""), { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-foreground">
                    {selectedNote?.content || "Sem conteúdo"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Notes list view
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <StickyNote className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <SheetTitle className="text-xl">Notas</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {notes?.length || 0} notas
                </p>
              </div>
            </div>
            <Button onClick={startCreating} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Nota
            </Button>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(90vh-120px)]">
            <div className="p-4 space-y-6">
              {/* My Notes */}
              {myNotes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Minhas Notas</h3>
                  <div className="space-y-2">
                    {myNotes.map(note => (
                      <div
                        key={note.id}
                        onClick={() => openNote(note)}
                        className="bg-card rounded-xl p-4 border border-border cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold truncate">{note.title}</h4>
                              {note.is_public ? (
                                <Eye className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <EyeOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {note.content || "Sem conteúdo"}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-2">
                              {formatDistanceToNow(new Date(note.updated_at), { locale: ptBR, addSuffix: true })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Notes from others */}
              {publicNotes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Notas Compartilhadas</h3>
                  <div className="space-y-2">
                    {publicNotes.map(note => (
                      <div
                        key={note.id}
                        onClick={() => openNote(note)}
                        className="bg-card rounded-xl p-4 border border-border cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold truncate">{note.title}</h4>
                          <Eye className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {note.content || "Sem conteúdo"}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          {formatDistanceToNow(new Date(note.updated_at), { locale: ptBR, addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {notes?.length === 0 && (
                <div className="text-center py-12">
                  <StickyNote className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma nota</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie notas para registrar informações importantes da campanha
                  </p>
                  <Button onClick={startCreating}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Nota
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
