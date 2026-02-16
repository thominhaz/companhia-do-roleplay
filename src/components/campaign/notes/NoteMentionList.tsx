import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NoteMentionItem {
  id: string;
  label: string;
}

interface NoteMentionListProps {
  items: NoteMentionItem[];
  command: (item: NoteMentionItem) => void;
}

export const NoteMentionList = forwardRef<any, NoteMentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [items]);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) command(item);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (!items.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-2 text-sm text-muted-foreground">
          Nenhuma nota encontrada
        </div>
      );
    }

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.id}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors',
              index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
            )}
            onClick={() => selectItem(index)}
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>
    );
  }
);

NoteMentionList.displayName = 'NoteMentionList';
