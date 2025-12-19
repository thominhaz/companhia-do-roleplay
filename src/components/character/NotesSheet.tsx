import { useState, useEffect } from "react";
import { FileText, Save, Plus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpdateCharacter, CharacterDB } from "@/hooks/useCharacters";
import { cn } from "@/lib/utils";

interface NotesSheetProps {
  character: CharacterDB;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export function NotesSheet({ character, open, onOpenChange }: NotesSheetProps) {
  const updateCharacter = useUpdateCharacter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Load notes from character's backstory field or a custom field
    // For now, we'll parse from a JSON in backstory if it contains notes
    try {
      const backstory = character.backstory || "";
      if (backstory.startsWith("[NOTES]")) {
        const notesJson = backstory.replace("[NOTES]", "");
        const parsed = JSON.parse(notesJson);
        setNotes(parsed);
      } else if (backstory) {
        // Convert existing backstory to a note
        setNotes([{
          id: "backstory",
          title: "História do Personagem",
          content: backstory,
          createdAt: character.created_at,
        }]);
      }
    } catch {
      setNotes([]);
    }
  }, [character]);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Nova Anotação",
      content: "",
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNote(newNote);
    setIsEditing(true);
  };

  const updateNote = (id: string, field: "title" | "content", value: string) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, [field]: value } : note
      )
    );
    if (selectedNote?.id === id) {
      setSelectedNote(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  const handleSave = async () => {
    // Save notes as JSON in backstory field
    const notesJson = `[NOTES]${JSON.stringify(notes)}`;
    
    await updateCharacter.mutateAsync({
      id: character.id,
      backstory: notesJson,
    });
    
    setIsEditing(false);
    onOpenChange(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] bg-darker">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Notas e Anotações
            </span>
            <Button size="sm" variant="outline" onClick={createNote}>
              <Plus className="w-4 h-4 mr-1" />
              Nova
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100%-8rem)] mt-4">
          {/* Notes List */}
          <ScrollArea className="h-full md:col-span-1">
            <div className="space-y-2 pr-2">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    setSelectedNote(note);
                    setIsEditing(false);
                  }}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition-colors",
                    selectedNote?.id === note.id
                      ? "bg-primary/20 border border-primary/50"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <h4 className="text-sm font-medium truncate">{note.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {note.content || "Sem conteúdo"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {formatDate(note.createdAt)}
                  </p>
                </button>
              ))}

              {notes.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma anotação</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={createNote}>
                    <Plus className="w-4 h-4 mr-1" />
                    Criar primeira nota
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Note Editor */}
          <div className="md:col-span-2 flex flex-col h-full">
            {selectedNote ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Input
                    value={selectedNote.title}
                    onChange={(e) => updateNote(selectedNote.id, "title", e.target.value)}
                    className="font-semibold"
                    placeholder="Título da nota"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteNote(selectedNote.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={selectedNote.content}
                  onChange={(e) => updateNote(selectedNote.id, "content", e.target.value)}
                  placeholder="Escreva suas anotações aqui..."
                  className="flex-1 resize-none min-h-[200px]"
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                  <p className="text-muted-foreground">Selecione uma nota para editar</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSave}
            disabled={updateCharacter.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateCharacter.isPending ? "Salvando..." : "Salvar Notas"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}