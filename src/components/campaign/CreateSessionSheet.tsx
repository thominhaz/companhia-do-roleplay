import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateSession } from "@/hooks/useSessions";
import { Loader2, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format, setHours, setMinutes, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CreateSessionSheetProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Pre-defined time slots
const timeSlots = [
  { label: "14:00", hours: 14, minutes: 0 },
  { label: "15:00", hours: 15, minutes: 0 },
  { label: "16:00", hours: 16, minutes: 0 },
  { label: "17:00", hours: 17, minutes: 0 },
  { label: "18:00", hours: 18, minutes: 0 },
  { label: "19:00", hours: 19, minutes: 0 },
  { label: "20:00", hours: 20, minutes: 0 },
  { label: "21:00", hours: 21, minutes: 0 },
  { label: "22:00", hours: 22, minutes: 0 },
];

export function CreateSessionSheet({ campaignId, open, onOpenChange }: CreateSessionSheetProps) {
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<{ hours: number; minutes: number } | null>(null);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  
  const createSession = useCreateSession();

  const handleCreate = async () => {
    if (!title.trim() || !selectedDate || !selectedTime) return;
    
    const scheduledAt = setMinutes(setHours(selectedDate, selectedTime.hours), selectedTime.minutes);
    
    try {
      await createSession.mutateAsync({
        campaign_id: campaignId,
        title: title.trim(),
        scheduled_at: scheduledAt.toISOString(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setTitle("");
      setSelectedDate(undefined);
      setSelectedTime(null);
      setLocation("");
      setNotes("");
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const today = startOfDay(new Date());

  const formattedDateTime = selectedDate && selectedTime
    ? format(
        setMinutes(setHours(selectedDate, selectedTime.hours), selectedTime.minutes),
        "EEEE, d 'de' MMMM 'às' HH:mm",
        { locale: ptBR }
      )
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Agendar Sessão</SheetTitle>
              <p className="text-sm text-muted-foreground">Marque o próximo encontro</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-180px)] pr-4">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Sessão 1 - O Início da Jornada"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-muted/50 border-0"
              />
            </div>

            {/* Date Selector */}
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted/50 border-0 h-11",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate 
                      ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR }) 
                      : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setDatePopoverOpen(false);
                    }}
                    disabled={(date) => isBefore(date, today)}
                    initialFocus
                    locale={ptBR}
                    className="pointer-events-auto"
                    components={{
                      IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                      IconRight: () => <ChevronRight className="h-4 w-4" />,
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horário *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.label}
                    type="button"
                    variant={selectedTime?.hours === slot.hours && selectedTime?.minutes === slot.minutes ? "default" : "outline"}
                    className={cn(
                      "h-11 text-base font-medium",
                      selectedTime?.hours === slot.hours && selectedTime?.minutes === slot.minutes
                        ? ""
                        : "bg-muted/50 border-0 hover:bg-muted"
                    )}
                    onClick={() => setSelectedTime({ hours: slot.hours, minutes: slot.minutes })}
                  >
                    {slot.label}
                  </Button>
                ))}
              </div>
              
              {/* Custom time input */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-muted-foreground">Outro horário:</span>
                <Input
                  type="time"
                  className="w-32 bg-muted/50 border-0"
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    if (!isNaN(hours) && !isNaN(minutes)) {
                      setSelectedTime({ hours, minutes });
                    }
                  }}
                />
              </div>
            </div>

            {/* Selected datetime preview */}
            {formattedDateTime && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium text-primary capitalize">
                  📅 {formattedDateTime}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="location">Local / Link</Label>
              <Input
                id="location"
                placeholder="Ex: Discord, Roll20, Casa do João..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-muted/50 border-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Anotações sobre a sessão..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-muted/50 border-0 min-h-[80px]"
              />
            </div>
          </div>
        </ScrollArea>

        <div className="pt-4">
          <Button 
            onClick={handleCreate} 
            disabled={!title.trim() || !selectedDate || !selectedTime || createSession.isPending}
            className="w-full h-12 text-base font-semibold"
          >
            {createSession.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Agendar Sessão"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
