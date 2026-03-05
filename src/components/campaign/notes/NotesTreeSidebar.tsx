import { useState } from 'react';
import { CampaignNote } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Plus, 
  Eye, 
  EyeOff,
  Trash2,
  StickyNote,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface NotesTreeSidebarProps {
  notes: CampaignNote[];
  selectedNoteId: string | null;
  onSelectNote: (note: CampaignNote) => void;
  onCreateNote: (parentId?: string) => void;
  onDeleteNote: (note: CampaignNote) => void;
  onMoveNote?: (noteId: string, direction: 'up' | 'down') => void;
}

interface TreeNode {
  note: CampaignNote;
  children: TreeNode[];
}

function buildTree(notes: CampaignNote[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Sort by sort_order first
  const sorted = [...notes].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  sorted.forEach(note => {
    map.set(note.id, { note, children: [] });
  });

  sorted.forEach(note => {
    const node = map.get(note.id)!;
    const parentId = note.parent_id;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function TreeItem({ 
  node, 
  depth, 
  selectedNoteId, 
  expandedIds, 
  toggleExpand,
  onSelectNote, 
  onCreateNote,
  onDeleteNote,
  onMoveNote,
  userId,
  isFirst,
  isLast,
}: {
  node: TreeNode;
  depth: number;
  selectedNoteId: string | null;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  onSelectNote: (note: CampaignNote) => void;
  onCreateNote: (parentId?: string) => void;
  onDeleteNote: (note: CampaignNote) => void;
  onMoveNote?: (noteId: string, direction: 'up' | 'down') => void;
  userId?: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.note.id);
  const isSelected = selectedNoteId === node.note.id;
  const isOwner = node.note.user_id === userId;

  return (
    <div>
      <div
        className={cn(
          'group flex items-start gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm',
          isSelected 
            ? 'bg-primary/20 text-primary border border-primary/30' 
            : 'hover:bg-muted/60'
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelectNote(node.note)}
      >
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          {hasChildren ? (
            <button
              className="p-0.5 hover:bg-muted rounded"
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.note.id); }}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-4.5" />
          )}
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        
        <span className="flex-1 min-w-0 break-words leading-snug">{node.note.title}</span>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
          {isOwner && onMoveNote && (
            <>
              <button
                className={cn("p-0.5 hover:bg-accent rounded", isFirst && "opacity-30 pointer-events-none")}
                onClick={(e) => { e.stopPropagation(); onMoveNote(node.note.id, 'up'); }}
                title="Mover para cima"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                className={cn("p-0.5 hover:bg-accent rounded", isLast && "opacity-30 pointer-events-none")}
                onClick={(e) => { e.stopPropagation(); onMoveNote(node.note.id, 'down'); }}
                title="Mover para baixo"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </>
          )}
          {node.note.is_public ? (
            <Eye className="w-3 h-3 text-muted-foreground" />
          ) : (
            <EyeOff className="w-3 h-3 text-muted-foreground" />
          )}
          {isOwner && (
            <>
              <button
                className="p-0.5 hover:bg-accent rounded"
                onClick={(e) => { e.stopPropagation(); onCreateNote(node.note.id); }}
                title="Criar sub-nota"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                className="p-0.5 hover:bg-destructive/20 rounded text-destructive"
                onClick={(e) => { e.stopPropagation(); onDeleteNote(node.note); }}
                title="Excluir"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child, idx) => (
            <TreeItem
              key={child.note.id}
              node={child}
              depth={depth + 1}
              selectedNoteId={selectedNoteId}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onSelectNote={onSelectNote}
              onCreateNote={onCreateNote}
              onDeleteNote={onDeleteNote}
              onMoveNote={onMoveNote}
              userId={userId}
              isFirst={idx === 0}
              isLast={idx === node.children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function NotesTreeSidebar({ notes, selectedNoteId, onSelectNote, onCreateNote, onDeleteNote, onMoveNote }: NotesTreeSidebarProps) {
  const { user } = useAuth();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const myNotes = notes.filter(n => n.user_id === user?.id);
  const sharedNotes = notes.filter(n => n.is_public && n.user_id !== user?.id);

  const myTree = buildTree(myNotes);
  const sharedTree = buildTree(sharedNotes);

  return (
    <div className="flex flex-col h-full border-r border-border bg-muted/20">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-sm">Notas</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onCreateNote()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {myTree.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1 font-semibold">Minhas Notas</p>
              {myTree.map((node, idx) => (
                <TreeItem
                  key={node.note.id}
                  node={node}
                  depth={0}
                  selectedNoteId={selectedNoteId}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                  onSelectNote={onSelectNote}
                  onCreateNote={onCreateNote}
                  onDeleteNote={onDeleteNote}
                  onMoveNote={onMoveNote}
                  userId={user?.id}
                  isFirst={idx === 0}
                  isLast={idx === myTree.length - 1}
                />
              ))}
            </div>
          )}

          {sharedTree.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1 font-semibold">Compartilhadas</p>
              {sharedTree.map((node, idx) => (
                <TreeItem
                  key={node.note.id}
                  node={node}
                  depth={0}
                  selectedNoteId={selectedNoteId}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                  onSelectNote={onSelectNote}
                  onCreateNote={onCreateNote}
                  onDeleteNote={onDeleteNote}
                  onMoveNote={onMoveNote}
                  userId={user?.id}
                  isFirst={idx === 0}
                  isLast={idx === sharedTree.length - 1}
                />
              ))}
            </div>
          )}

          {notes.length === 0 && (
            <div className="text-center py-8 px-4">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma nota ainda</p>
              <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => onCreateNote()}>
                <Plus className="w-3 h-3 mr-1" />
                Criar primeira nota
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
