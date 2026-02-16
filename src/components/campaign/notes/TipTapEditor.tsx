import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCampaignImageUpload } from '@/hooks/useCampaignImageUpload';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  ImagePlus,
  Undo,
  Redo,
  Minus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  campaignId: string;
  placeholder?: string;
  editable?: boolean;
}

export function TipTapEditor({ content, onChange, campaignId, placeholder = 'Escreva aqui...', editable = true }: TipTapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useCampaignImageUpload();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full my-2',
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const url = await uploadImage(file, { folder: `notes/${campaignId}`, maxSizeKB: 500 });
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!editor) return null;

  if (!editable) {
    return (
      <div className="prose prose-invert max-w-none prose-img:rounded-lg prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground/80">
        <EditorContent editor={editor} />
      </div>
    );
  }

  const ToolbarButton = ({ isActive, onClick, children, disabled }: { isActive?: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8', isActive && 'bg-accent text-accent-foreground')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 border-b border-border bg-muted/30 flex-wrap">
        <ToolbarButton isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton isActive={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton isActive={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton isActive={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton isActive={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        <ToolbarButton onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        </ToolbarButton>

        <div className="flex-1" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="p-3 min-h-[200px] [&_.tiptap]:outline-none [&_.tiptap]:min-h-[180px] [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_h1]:text-2xl [&_.tiptap_h1]:font-bold [&_.tiptap_h1]:mb-2 [&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:mb-2 [&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-semibold [&_.tiptap_h3]:mb-1 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-primary/50 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:italic [&_.tiptap_blockquote]:text-muted-foreground [&_.tiptap_pre]:bg-muted [&_.tiptap_pre]:rounded-lg [&_.tiptap_pre]:p-3 [&_.tiptap_pre]:font-mono [&_.tiptap_pre]:text-sm [&_.tiptap_hr]:border-border [&_.tiptap_hr]:my-4 [&_.tiptap_img]:rounded-lg [&_.tiptap_img]:max-w-full [&_.tiptap_p]:mb-1">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
