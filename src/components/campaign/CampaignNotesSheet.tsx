import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCampaignNotes, useCreateNote, useUpdateNote, useDeleteNote, CampaignNote } from "@/hooks/useNotes";
import { useAuth } from "@/hooks/useAuth";
import { 
  Loader2, 
  Eye, 
  EyeOff,
  Save,
  Edit,
  FileText,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotesTreeSidebar } from "./notes/NotesTreeSidebar";
import { TipTapEditor } from "./notes/TipTapEditor";

interface CampaignNotesSheetProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignNotesSheet({ campaignId, open, onOpenChange }: CampaignNotesSheetProps) {
  const { user } = useAuth();
  const [selectedNote, setSelectedNote] = useState<CampaignNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "", is_public: false });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: notes, isLoading } = useCampaignNotes(campaignId);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  // Sync selected note with latest data
  useEffect(() => {
    if (selectedNote && notes) {
      const updated = notes.find(n => n.id === selectedNote.id);
      if (updated) setSelectedNote(updated);
    }
  }, [notes, selectedNote]);

  const handleCreateNote = async (parentId?: string) => {
    const newNote = await createNote.mutateAsync({
      campaign_id: campaignId,
      title: "Nova Nota",
      content: "",
      is_public: false,
      parent_id: parentId || null,
    });

    if (newNote) {
      setSelectedNote(newNote);
      setEditForm({ title: newNote.title, content: "", is_public: false });
      setIsEditing(true);
    }
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

  const isOwner = selectedNote?.user_id === user?.id;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Notas da Campanha</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex h-full">
            {/* Sidebar */}
            {sidebarOpen && (
              <div className="w-64 flex-shrink-0">
                <NotesTreeSidebar
                  notes={notes || []}
                  selectedNoteId={selectedNote?.id || null}
                  onSelectNote={openNote}
                  onCreateNote={handleCreateNote}
                  onDeleteNote={handleDeleteNote}
                />
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 p-3 border-b border-border">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                </Button>

                {selectedNote && !isEditing && (
                  <>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold truncate">{selectedNote.title}</h2>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {selectedNote.profile && (
                          <>
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={selectedNote.profile.avatar_url || undefined} />
                              <AvatarFallback className="text-[8px]">
                                {selectedNote.profile.display_name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{selectedNote.profile.display_name || 'Jogador'}</span>
                            <span>•</span>
                          </>
                        )}
                        {selectedNote.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{selectedNote.is_public ? "Pública" : "Privada"}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(selectedNote.updated_at), { locale: ptBR, addSuffix: true })}</span>
                      </div>
                    </div>
                    {isOwner && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={startEditing}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}

                {isEditing && selectedNote && (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="h-8 font-semibold"
                      placeholder="Título da nota..."
                    />
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        {editForm.is_public ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                        <Switch
                          checked={editForm.is_public}
                          onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_public: checked }))}
                          className="scale-75"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleUpdateNote}
                        disabled={!editForm.title.trim() || updateNote.isPending}
                      >
                        {updateNote.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Salvar
                      </Button>
                    </div>
                  </div>
                )}

                {!selectedNote && (
                  <span className="text-sm text-muted-foreground">Selecione ou crie uma nota</span>
                )}
              </div>

              {/* Content */}
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {selectedNote ? (
                    isEditing ? (
                      <TipTapEditor
                        content={editForm.content}
                        onChange={(html) => setEditForm(prev => ({ ...prev, content: html }))}
                        campaignId={campaignId}
                        placeholder="Escreva sua nota aqui..."
                      />
                    ) : (
                      <TipTapEditor
                        content={selectedNote.content || "<p></p>"}
                        onChange={() => {}}
                        campaignId={campaignId}
                        editable={false}
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">Selecione uma nota para visualizar</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
