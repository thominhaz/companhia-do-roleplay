import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance } from 'tippy.js';
import { NoteMentionList, type NoteMentionItem } from './NoteMentionList';
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';

export function createNoteMentionSuggestion(
  getItems: () => NoteMentionItem[]
): Omit<SuggestionOptions<NoteMentionItem>, 'editor'> {
  return {
    char: '@',
    items: ({ query }) => {
      const all = getItems();
      if (!query) return all.slice(0, 10);
      return all
        .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10);
    },
    render: () => {
      let component: ReactRenderer<any> | null = null;
      let popup: Instance[] | null = null;

      return {
        onStart: (props: SuggestionProps<NoteMentionItem>) => {
          component = new ReactRenderer(NoteMentionList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) return;

          // @ts-ignore
          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
        },
        onUpdate: (props: SuggestionProps<NoteMentionItem>) => {
          component?.updateProps(props);
          if (props.clientRect) {
            popup?.[0]?.setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            });
          }
        },
        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          popup?.[0]?.destroy();
          component?.destroy();
        },
      };
    },
  };
}
