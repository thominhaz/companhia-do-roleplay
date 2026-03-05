import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimelineEvent } from "@/hooks/useTimeline";
import { 
  Calendar, Sword, Shield, Crown, Skull, Map, 
  Users, Star, Heart, Flame, BookOpen, Castle
} from "lucide-react";

interface TimelineEventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: TimelineEvent | null;
  onSubmit: (data: Partial<TimelineEvent>) => void;
  isPending?: boolean;
}

const ICON_OPTIONS = [
  { value: "calendar", label: "Calendário", icon: Calendar },
  { value: "sword", label: "Espada", icon: Sword },
  { value: "shield", label: "Escudo", icon: Shield },
  { value: "crown", label: "Coroa", icon: Crown },
  { value: "skull", label: "Caveira", icon: Skull },
  { value: "map", label: "Mapa", icon: Map },
  { value: "users", label: "Grupo", icon: Users },
  { value: "star", label: "Estrela", icon: Star },
  { value: "heart", label: "Coração", icon: Heart },
  { value: "flame", label: "Fogo", icon: Flame },
  { value: "book", label: "Livro", icon: BookOpen },
  { value: "castle", label: "Castelo", icon: Castle },
];

const COLOR_OPTIONS = [
  { value: "primary", label: "Laranja", class: "bg-primary" },
  { value: "cyan", label: "Ciano", class: "bg-cyan-500" },
  { value: "purple", label: "Roxo", class: "bg-purple-500" },
  { value: "red", label: "Vermelho", class: "bg-red-500" },
  { value: "green", label: "Verde", class: "bg-green-500" },
  { value: "yellow", label: "Amarelo", class: "bg-yellow-500" },
  { value: "pink", label: "Rosa", class: "bg-pink-500" },
  { value: "blue", label: "Azul", class: "bg-blue-500" },
];

export function TimelineEventForm({ open, onOpenChange, event, onSubmit, isPending }: TimelineEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [icon, setIcon] = useState("calendar");
  const [color, setColor] = useState("primary");
  const [isMajorEvent, setIsMajorEvent] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (open) {
      if (event) {
        setTitle(event.title || "");
        setDescription(event.description || "");
        setEventDate(event.event_date || "");
        setIcon(event.icon || "calendar");
        setColor(event.color || "primary");
        setIsMajorEvent(event.is_major_event || false);
        setIsHidden(event.is_hidden || false);
      } else {
        setTitle("");
        setDescription("");
        setEventDate("");
        setIcon("calendar");
        setColor("primary");
        setIsMajorEvent(false);
        setIsHidden(false);
      }
    }
  }, [open, event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: event?.id,
      title,
      description: description || null,
      event_date: eventDate,
      icon,
      color,
      is_major_event: isMajorEvent,
      is_hidden: isHidden,
    });
    onOpenChange(false);
  };

  const SelectedIcon = ICON_OPTIONS.find(i => i.value === icon)?.icon || Calendar;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{event ? "Editar Evento" : "Novo Evento na Timeline"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: A Queda de Eldoria"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Data no Jogo *</Label>
            <Input 
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              placeholder="Ex: Ano 1045, Inverno"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que aconteceu..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <SelectedIcon className="w-4 h-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${COLOR_OPTIONS.find(c => c.value === color)?.class}`} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${opt.class}`} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label>Evento Principal</Label>
              <p className="text-xs text-muted-foreground">Destacar como marco importante</p>
            </div>
            <Switch 
              checked={isMajorEvent}
              onCheckedChange={setIsMajorEvent}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label>Oculto para Jogadores</Label>
              <p className="text-xs text-muted-foreground">Apenas o mestre pode ver este evento</p>
            </div>
            <Switch 
              checked={isHidden}
              onCheckedChange={setIsHidden}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {event ? "Salvar Alterações" : "Adicionar Evento"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
