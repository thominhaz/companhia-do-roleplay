import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  FileText,
  Loader2,
  Eye,
  EyeOff,
  Palette,
  Tag,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  usePersonalNotes, 
  useCreatePersonalNote, 
  useUpdatePersonalNote, 
  useDeletePersonalNote,
  useTogglePinNote,
  PersonalNote 
} from "@/hooks/usePersonalNotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface QuickNotesProps {
  onBack: () => void;
}

const NOTE_COLORS = [
  { id: "default", label: "Padrão", class: "glass-card" },
  { id: "solar", label: "Solar", class: "glass-card-solar" },
  { id: "purple", label: "Roxo", class: "glass-card-purple" },
  { id: "cyan", label: "Ciano", class: "glass-card-cyan" },
  { id: "magenta", label: "Magenta", class: "glass-card-magenta" },
];

const TAG_COLORS = [
  "bg-solar-orange/20 text-solar-orange border-solar-orange/30",
  "bg-cosmic-purple/20 text-cosmic-purple border-cosmic-purple/30",
  "bg-cyan-blue/20 text-cyan-blue border-cyan-blue/30",
  "bg-magenta-red/20 text-magenta-red border-magenta-red/30",
  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "bg-amber-500/20 text-amber-400 border-amber-500/30",
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

// Simple markdown renderer
function renderMarkdown(text: string): string {
  if (!text) return "";
  
  let html = text
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-foreground">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2 text-foreground">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2 text-foreground">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-solar-orange">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/~~(.*?)~~/g, '<del class="line-through text-muted-foreground">$1</del>')
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-cyan-blue font-mono text-sm">$1</code>')
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-foreground">$1</li>')
    .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-foreground">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-foreground">$1</li>')
    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-solar-orange pl-4 italic text-muted-foreground my-2">$1</blockquote>')
    .replace(/^---$/gim, '<hr class="border-border my-4" />')
    .replace(/\n/g, '<br />');

  html = html.replace(/(<li.*<\li>)(<br \/>)?(<li)/g, '$1$3');

  return html;
}

export function QuickNotes({ onBack }: QuickNotesProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: notes, isLoading } = usePersonalNotes();
  const createNote = useCreatePersonalNote();
  const updateNote = useUpdatePersonalNote();
  const deleteNote = useDeletePersonalNote();
  const togglePin = useTogglePinNote();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<PersonalNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  
  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState("default");
  const [editTags, setEditTags] = useState<string[]>([]);

  // Auto-save timer
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get all unique tags from notes
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes?.forEach(note => {
      note.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [notes]);

  const filteredNotes = notes?.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = !filterTag || note.tags?.includes(filterTag);
    
    return matchesSearch && matchesTag;
  }) || [];

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.is_pinned);

  const handleCreateNote = async () => {
    if (!user) {
      toast.error("Faça login para criar notas", {
        action: {
          label: "Entrar",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }

    try {
      const newNote = await createNote.mutateAsync({
        title: "Nova Nota",
        content: "",
        color: "default",
        tags: []
      });
      setSelectedNote(newNote);
      setEditTitle(newNote.title);
      setEditContent(newNote.content || "");
      setEditColor(newNote.color);
      setEditTags(newNote.tags || []);
      setIsEditing(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectNote = (note: PersonalNote) => {
    if (selectedNote && isEditing) {
      saveNote();
    }
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || "");
    setEditColor(note.color);
    setEditTags(note.tags || []);
    setIsEditing(false);
    setShowPreview(false);
    setShowTagInput(false);
  };

  const saveNote = useCallback(() => {
    if (!selectedNote) return;
    
    const tagsChanged = JSON.stringify(editTags) !== JSON.stringify(selectedNote.tags);
    
    if (editTitle !== selectedNote.title || 
        editContent !== selectedNote.content ||
        editColor !== selectedNote.color ||
        tagsChanged) {
      updateNote.mutate({
        id: selectedNote.id,
        title: editTitle || "Sem título",
        content: editContent,
        color: editColor,
        tags: editTags
      });
    }
  }, [selectedNote, editTitle, editContent, editColor, editTags, updateNote]);

  // Auto-save on content change
  useEffect(() => {
    if (isEditing && selectedNote) {
      if (saveTimeout) clearTimeout(saveTimeout);
      const timeout = setTimeout(() => {
        saveNote();
      }, 1500);
      setSaveTimeout(timeout);
    }
    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [editTitle, editContent, editColor, editTags]);

  const handleDelete = (id: string) => {
    setNoteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteNote.mutate(noteToDelete);
      if (selectedNote?.id === noteToDelete) {
        setSelectedNote(null);
        setIsEditing(false);
      }
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  const handleTogglePin = (note: PersonalNote) => {
    togglePin.mutate({ id: note.id, isPinned: note.is_pinned });
  };

  const getColorClass = (color: string) => {
    return NOTE_COLORS.find(c => c.id === color)?.class || "glass-card";
  };

  const handleAddTag = () => {
    const tag = newTagInput.trim().toLowerCase();
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
      setIsEditing(true);
    }
    setNewTagInput("");
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove));
    setIsEditing(true);
  };

  // Note list view
  if (!selectedNote) {
    return (
      <div className="min-h-screen bg-darker pb-24">
        <AppHeader
          title="Notas Rápidas"
          subtitle="Suas anotações pessoais"
          rightContent={
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          }
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted border-0"
            />
          </div>
        </AppHeader>

        <main className="px-4 py-4 max-w-lg mx-auto">
          {/* Tags filter */}
          {allTags.length > 0 && (
            <div className="mb-4 overflow-x-auto pb-2">
              <div className="flex gap-2 items-center">
                <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <button
                  onClick={() => setFilterTag(null)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                    !filterTag 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  Todas
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
                      filterTag === tag 
                        ? getTagColor(tag)
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create button */}
          <Button
            onClick={handleCreateNote}
            variant="gradient"
            className="w-full mb-6 h-14 text-base font-bold shadow-lg hover:shadow-xl border-2 border-primary/30"
            disabled={createNote.isPending}
          >
            {createNote.isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Plus className="w-5 h-5 mr-2" />
            )}
            Nova Nota
          </Button>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || filterTag ? "Nenhuma nota encontrada" : "Nenhuma nota ainda"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterTag 
                  ? "Tente buscar com outros termos ou remova o filtro" 
                  : "Crie sua primeira nota para começar!"}
              </p>
              {filterTag && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilterTag(null)}
                  className="mt-4"
                >
                  Limpar filtro
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pinned notes */}
              {pinnedNotes.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Pin className="w-3 h-3" />
                    Fixadas
                  </h2>
                  <div className="grid grid-cols-2 gap-3 stagger-fast">
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onClick={() => handleSelectNote(note)}
                        onPin={() => handleTogglePin(note)}
                        onDelete={() => handleDelete(note.id)}
                        colorClass={getColorClass(note.color)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Other notes */}
              {unpinnedNotes.length > 0 && (
                <section>
                  {pinnedNotes.length > 0 && (
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Outras Notas
                    </h2>
                  )}
                  <div className="grid grid-cols-2 gap-3 stagger-fast">
                    {unpinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onClick={() => handleSelectNote(note)}
                        onPin={() => handleTogglePin(note)}
                        onDelete={() => handleDelete(note.id)}
                        colorClass={getColorClass(note.color)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir nota?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A nota será permanentemente removida.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Note editor view
  return (
    <div className="min-h-screen bg-darker pb-24 flex flex-col">
      <AppHeader
        rightContent={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowTagInput(!showTagInput);
                setShowColorPicker(false);
              }}
              className="relative"
            >
              <Tag className="w-5 h-5" />
              {editTags.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                  {editTags.length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowTagInput(false);
              }}
              className="relative"
            >
              <Palette className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleTogglePin(selectedNote)}
            >
              <Pin className={cn("w-5 h-5", selectedNote.is_pinned && "fill-solar-orange text-solar-orange")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                saveNote();
                setSelectedNote(null);
                setIsEditing(false);
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        }
      >
        {/* Color picker dropdown */}
        {showColorPicker && (
          <div className="flex gap-2 mt-2">
            {NOTE_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => {
                  setEditColor(color.id);
                  setShowColorPicker(false);
                  setIsEditing(true);
                }}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  color.id === "default" && "bg-muted",
                  color.id === "solar" && "bg-solar-orange",
                  color.id === "purple" && "bg-cosmic-purple",
                  color.id === "cyan" && "bg-cyan-blue",
                  color.id === "magenta" && "bg-magenta-red",
                  editColor === color.id ? "border-foreground scale-110" : "border-transparent"
                )}
                title={color.label}
              />
            ))}
          </div>
        )}

        {/* Tag input */}
        {showTagInput && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Nova tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="bg-muted border-0 h-8 text-sm"
              />
              <Button 
                size="sm" 
                onClick={handleAddTag}
                disabled={!newTagInput.trim()}
                className="h-8"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Current tags */}
            {editTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {editTags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={cn("text-xs cursor-pointer group", getTagColor(tag))}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Suggested tags */}
            {allTags.filter(t => !editTags.includes(t)).length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1.5">Tags existentes:</p>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.filter(t => !editTags.includes(t)).map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs cursor-pointer bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                      onClick={() => {
                        setEditTags([...editTags, tag]);
                        setIsEditing(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AppHeader>

      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full flex flex-col">
        <div className={cn("rounded-2xl p-4 flex-1 flex flex-col", getColorClass(editColor))}>
          {/* Title */}
          <input
            type="text"
            value={editTitle}
            onChange={(e) => {
              setEditTitle(e.target.value);
              setIsEditing(true);
            }}
            placeholder="Título da nota..."
            className="bg-transparent border-0 text-xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none mb-2"
          />

          {/* Tags display */}
          {editTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {editTags.map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn("text-xs", getTagColor(tag))}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Content */}
          {showPreview ? (
            <div 
              className="flex-1 prose prose-invert max-w-none text-sm text-foreground/90 overflow-auto"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
            />
          ) : (
            <Textarea
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                setIsEditing(true);
              }}
              placeholder="Escreva sua nota aqui...&#10;&#10;Suporta Markdown:&#10;# Título&#10;**negrito** *itálico*&#10;- lista&#10;> citação&#10;`código`"
              className="flex-1 bg-transparent border-0 resize-none text-sm text-foreground/90 placeholder:text-muted-foreground/50 focus:outline-none focus-visible:ring-0 min-h-[300px]"
            />
          )}
        </div>

        {/* Markdown help */}
        <div className="mt-4 glass-card rounded-xl p-3">
          <p className="text-xs text-muted-foreground text-center">
            <span className="text-solar-orange font-semibold">Markdown:</span>{" "}
            <code className="bg-muted px-1 rounded"># Título</code>{" "}
            <code className="bg-muted px-1 rounded">**negrito**</code>{" "}
            <code className="bg-muted px-1 rounded">*itálico*</code>{" "}
            <code className="bg-muted px-1 rounded">`código`</code>{" "}
            <code className="bg-muted px-1 rounded">- lista</code>
          </p>
        </div>
      </main>
    </div>
  );
}

// Note card component
interface NoteCardProps {
  note: PersonalNote;
  onClick: () => void;
  onPin: () => void;
  onDelete: () => void;
  colorClass: string;
}

function NoteCard({ note, onClick, onPin, onDelete, colorClass }: NoteCardProps) {
  const preview = note.content?.slice(0, 100) || "";
  
  return (
    <div 
      className={cn(
        "rounded-xl p-3 card-interactive cursor-pointer group",
        colorClass
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm text-foreground truncate flex-1 pr-2">
          {note.title || "Sem título"}
        </h3>
        {note.is_pinned && (
          <Pin className="w-3 h-3 text-solar-orange fill-solar-orange flex-shrink-0" />
        )}
      </div>
      
      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium border",
                getTagColor(tag)
              )}
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground">
              +{note.tags.length - 2}
            </span>
          )}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {preview || "Nota vazia..."}
      </p>
      
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/60">
          {new Date(note.updated_at).toLocaleDateString('pt-BR')}
        </span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            className="p-1 hover:bg-muted/50 rounded"
          >
            <Pin className={cn("w-3 h-3", note.is_pinned ? "fill-solar-orange text-solar-orange" : "text-muted-foreground")} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-destructive/20 rounded"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}
