import { useState, useEffect } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useCampaignNotes, useCreateNote, useUpdateNote, useDeleteNote, CampaignNote } from "@/hooks/useNotes";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotesTreeSidebar } from "../notes/NotesTreeSidebar";
import { TipTapEditor } from "../notes/TipTapEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2, Eye, EyeOff, Save, Edit, FileText, PanelLeftClose, PanelLeft,
} from "lucide-react";

interface DashboardNotesProps {
  campaign: CampaignDB;
  isMaster: boolean;
}

export function DashboardNotes({ campaign, isMaster }: DashboardNotesProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedNote, setSelectedNote] = useState<CampaignNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "", is_public: false });
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const { data: notes, isLoading } = useCampaignNotes(campaign.id);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  // Close sidebar on mobile when selecting a note
  useEffect(() => {
    if (isMobile && selectedNote) {
      setSidebarOpen(false);
    }
  }, [selectedNote, isMobile]);

  useEffect(() => {
    if (selectedNote && notes) {
      const updated = notes.find(n => n.id === selectedNote.id);
      if (updated) setSelectedNote(updated);
    }
  }, [notes]);

  const handleCreateNote = async (parentId?: string) => {
    const newNote = await createNote.mutateAsync({
      campaign_id: campaign.id,
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
      campaignId: campaign.id,
      title: editForm.title,
      content: editForm.content,
      is_public: editForm.is_public,
    });
    setIsEditing(false);
  };

  const handleDeleteNote = async (note: CampaignNote) => {
    await deleteNote.mutateAsync({ id: note.id, campaignId: campaign.id });
    if (selectedNote?.id === note.id) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  const openNote = (note: CampaignNote) => {
    setSelectedNote(note);
    setEditForm({ title: note.title, content: note.content || "", is_public: note.is_public });
    setIsEditing(false);
  };

  const navigateToNote = (noteId: string) => {
    const target = notes?.find(n => n.id === noteId);
    if (target) openNote(target);
  };

  const availableNotes = (notes || []).map(n => ({ id: n.id, label: n.title }));

  const startEditing = () => {
    if (selectedNote) {
      setEditForm({ title: selectedNote.title, content: selectedNote.content || "", is_public: selectedNote.is_public });
      setIsEditing(true);
    }
  };

  const isOwner = selectedNote?.user_id === user?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] rounded-xl border border-border overflow-hidden bg-card relative">
      {/* Sidebar - Desktop inline, Mobile overlay */}
      {sidebarOpen && (
        <>
          {isMobile && (
            <div className="absolute inset-0 z-10 bg-black/50" onClick={() => setSidebarOpen(false)} />
          )}
          <div className={
            isMobile
              ? "absolute left-0 top-0 bottom-0 z-20 w-64 bg-card border-r border-border"
              : "w-64 flex-shrink-0"
          }>
            <NotesTreeSidebar
              notes={notes || []}
              selectedNoteId={selectedNote?.id || null}
              onSelectNote={openNote}
              onCreateNote={handleCreateNote}
              onDeleteNote={handleDeleteNote}
            />
          </div>
        </>
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
                <Button size="sm" onClick={handleUpdateNote} disabled={!editForm.title.trim() || updateNote.isPending}>
                  {updateNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
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
                  key={`edit-${selectedNote.id}`}
                  content={editForm.content}
                  onChange={(html) => setEditForm(prev => ({ ...prev, content: html }))}
                  campaignId={campaign.id}
                  placeholder="Escreva sua nota aqui... Use @ para mencionar outras notas"
                  availableNotes={availableNotes}
                  onNavigateToNote={navigateToNote}
                />
              ) : (
              <TipTapEditor
                  key={`view-${selectedNote.id}-${selectedNote.updated_at}`}
                  content={selectedNote.content || "<p></p>"}
                  onChange={() => {}}
                  campaignId={campaign.id}
                  editable={false}
                  availableNotes={availableNotes}
                  onNavigateToNote={navigateToNote}
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
  );
}
