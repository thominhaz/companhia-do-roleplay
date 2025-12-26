import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useTimeline, TimelineEvent } from "@/hooks/useTimeline";
import { useAuth } from "@/hooks/useAuth";
import { TimelineEventForm } from "./TimelineEventForm";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  Clock, Plus, Edit, Trash2, 
  Calendar, Sword, Shield, Crown, Skull, Map, 
  Users, Star, Heart, Flame, BookOpen, Castle,
  LayoutList, LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface WorkshopTimelineProps {
  campaign: CampaignDB;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  calendar: Calendar,
  sword: Sword,
  shield: Shield,
  crown: Crown,
  skull: Skull,
  map: Map,
  users: Users,
  star: Star,
  heart: Heart,
  flame: Flame,
  book: BookOpen,
  castle: Castle,
};

const COLOR_MAP: Record<string, string> = {
  primary: "from-primary to-primary/70 border-primary",
  cyan: "from-cyan-500 to-cyan-400 border-cyan-500",
  purple: "from-purple-500 to-purple-400 border-purple-500",
  red: "from-red-500 to-red-400 border-red-500",
  green: "from-green-500 to-green-400 border-green-500",
  yellow: "from-yellow-500 to-yellow-400 border-yellow-500",
  pink: "from-pink-500 to-pink-400 border-pink-500",
  blue: "from-blue-500 to-blue-400 border-blue-500",
};

const COLOR_BG_MAP: Record<string, string> = {
  primary: "bg-primary",
  cyan: "bg-cyan-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  pink: "bg-pink-500",
  blue: "bg-blue-500",
};

export function WorkshopTimeline({ campaign }: WorkshopTimelineProps) {
  const { user } = useAuth();
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useTimeline(campaign.id);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<TimelineEvent | null>(null);
  const [viewMode, setViewMode] = useState<"horizontal" | "vertical">("horizontal");

  const handleSubmit = (data: Partial<TimelineEvent>) => {
    if (editingEvent) {
      updateEvent.mutate({ ...data, id: editingEvent.id });
    } else if (user) {
      createEvent.mutate({ ...data, created_by: user.id } as any);
    }
    setEditingEvent(null);
  };

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = () => {
    if (deletingEvent) {
      deleteEvent.mutate(deletingEvent.id);
      setDeletingEvent(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Timeline da Campanha
          </h2>
          <p className="text-sm text-muted-foreground">Visualize a linha do tempo da sua história</p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as "horizontal" | "vertical")}
            className="bg-muted rounded-lg p-1"
          >
            <ToggleGroupItem value="horizontal" aria-label="Visualização horizontal" className="px-3">
              <LayoutGrid className="w-4 h-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="vertical" aria-label="Visualização lista" className="px-3">
              <LayoutList className="w-4 h-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={() => { setEditingEvent(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Novo Evento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 border border-dashed border-border text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Comece sua Timeline</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Adicione eventos importantes da sua campanha para criar uma linha do tempo visual e interativa.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Evento
          </Button>
        </div>
      ) : viewMode === "horizontal" ? (
        <div className="bg-card rounded-2xl p-6 border">
          <ScrollArea className="w-full">
            <div className="relative min-w-max py-12 px-8">
              <div className="absolute left-8 right-8 top-1/2 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full transform -translate-y-1/2" />

              <div className="relative flex items-center">
                <AnimatePresence mode="popLayout">
                  {events.map((event, index) => {
                    const IconComponent = ICON_MAP[event.icon] || Calendar;
                    const colorClass = COLOR_MAP[event.color] || COLOR_MAP.primary;
                    const isAbove = index % 2 === 0;
                    
                    return (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, scale: 0.5, y: isAbove ? -30 : 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.3, 
                          y: isAbove ? -50 : 50,
                          transition: { duration: 0.3, ease: "easeInOut" }
                        }}
                        transition={{ 
                          delay: index * 0.08, 
                          duration: 0.4,
                          type: "spring",
                          stiffness: 300,
                          damping: 25
                        }}
                        className="flex flex-col items-center"
                        style={{ width: "200px", flexShrink: 0 }}
                      >
                        {isAbove && (
                          <motion.div 
                            className="w-44 mb-4 group"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 + 0.15, duration: 0.3 }}
                          >
                            <motion.div 
                              className="bg-background/80 backdrop-blur-sm rounded-xl p-4 pb-6 border shadow-lg transition-shadow duration-300 relative"
                              whileHover={{ scale: 1.03, boxShadow: "0 10px 40px -10px rgba(0,0,0,0.3)" }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(event)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setDeletingEvent(event)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>

                              <h4 className="font-semibold text-sm mb-1 line-clamp-2 pr-12">{event.title}</h4>
                              <p className="text-xs text-primary font-medium mb-2">{event.event_date}</p>
                              {event.description && (
                                <p className="text-xs text-muted-foreground line-clamp-3">{event.description}</p>
                              )}
                            </motion.div>

                            {/* Number Badge - outside the card */}
                            <motion.div 
                              className={`mx-auto -mt-3 relative z-20 w-8 h-8 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.08 + 0.25, type: "spring", stiffness: 500 }}
                            >
                              {String(index + 1).padStart(2, "0")}
                            </motion.div>

                            <motion.div 
                              className="mx-auto w-0.5 h-4 bg-gradient-to-b from-muted to-transparent"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ delay: index * 0.08 + 0.2, duration: 0.2 }}
                            />
                          </motion.div>
                        )}

                        {!isAbove && <div className="h-[140px]" />}

                        <motion.div
                          className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-br ${colorClass} p-1 shadow-lg cursor-pointer`}
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <motion.div 
                            className="w-full h-full rounded-full bg-background flex items-center justify-center"
                            initial={{ rotate: -180, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            transition={{ delay: index * 0.08 + 0.1, duration: 0.4 }}
                          >
                            <IconComponent className={`w-6 h-6 text-${event.color === 'primary' ? 'primary' : event.color + '-500'}`} />
                          </motion.div>
                          
                          {event.is_major_event && (
                            <motion.div 
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 border-2 border-background flex items-center justify-center"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.08 + 0.3, type: "spring", stiffness: 500 }}
                            >
                              <Star className="w-2.5 h-2.5 text-yellow-900" />
                            </motion.div>
                          )}
                        </motion.div>

                        {isAbove && <div className="h-[140px]" />}

                        {!isAbove && (
                          <motion.div 
                            className="w-44 mt-4 group"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 + 0.15, duration: 0.3 }}
                          >
                            {/* Number Badge - outside the card */}
                            <motion.div 
                              className={`mx-auto -mb-3 relative z-10 w-8 h-8 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.08 + 0.25, type: "spring", stiffness: 500 }}
                            >
                              {String(index + 1).padStart(2, "0")}
                            </motion.div>
                            
                            <motion.div 
                              className="bg-background/80 backdrop-blur-sm rounded-xl p-4 pt-6 border shadow-lg transition-shadow duration-300 relative"
                              whileHover={{ scale: 1.03, boxShadow: "0 10px 40px -10px rgba(0,0,0,0.3)" }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(event)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setDeletingEvent(event)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>

                              <h4 className="font-semibold text-sm mb-1 line-clamp-2 pr-12">{event.title}</h4>
                              <p className="text-xs text-primary font-medium mb-2">{event.event_date}</p>
                              {event.description && (
                                <p className="text-xs text-muted-foreground line-clamp-3">{event.description}</p>
                              )}
                            </motion.div>

                            <motion.div 
                              className="mx-auto w-0.5 h-4 bg-gradient-to-t from-muted to-transparent"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ delay: index * 0.08 + 0.2, duration: 0.2 }}
                            />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      ) : (
        <div className="bg-card rounded-2xl p-4 sm:p-6 border">
          <div className="relative">
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />
            
            <div className="space-y-0">
              <AnimatePresence mode="popLayout">
                {events.map((event, index) => {
                  const IconComponent = ICON_MAP[event.icon] || Calendar;
                  const colorClass = COLOR_MAP[event.color] || COLOR_MAP.primary;
                  const bgColor = COLOR_BG_MAP[event.color] || COLOR_BG_MAP.primary;
                  
                  return (
                    <motion.div
                      key={event.id}
                      layout
                      initial={{ opacity: 0, x: -40, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ 
                        opacity: 0, 
                        x: -60, 
                        scale: 0.8,
                        transition: { duration: 0.3, ease: "easeInOut" }
                      }}
                      transition={{ 
                        delay: index * 0.05, 
                        duration: 0.4,
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                      }}
                      className="relative pl-16 sm:pl-20 pb-8 last:pb-0 group"
                    >
                      <motion.div
                        className={`absolute left-2 sm:left-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br ${colorClass} p-0.5 shadow-lg z-10`}
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                      >
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                        </div>
                        
                        {event.is_major_event && (
                          <motion.div 
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 border-2 border-background flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 + 0.2, type: "spring", stiffness: 500 }}
                          >
                            <Star className="w-2 h-2 text-yellow-900" />
                          </motion.div>
                        )}
                      </motion.div>

                      <motion.div 
                        className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow duration-300 relative"
                        whileHover={{ x: 8, boxShadow: "0 8px 30px -10px rgba(0,0,0,0.2)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <motion.div 
                          className={`absolute -left-2 top-4 w-6 h-6 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-xs shadow-md`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05 + 0.15, type: "spring", stiffness: 500 }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </motion.div>

                        <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(event)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeletingEvent(event)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <div className="pr-16 sm:pr-0">
                          <p className={`text-xs font-semibold mb-1 ${event.color === 'primary' ? 'text-primary' : `text-${event.color}-500`}`}>
                            {event.event_date}
                          </p>
                          <h4 className="font-semibold text-base mb-1">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          )}
                        </div>

                        <motion.div 
                          className={`absolute left-0 top-6 w-3 h-0.5 ${bgColor} -translate-x-full`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: index * 0.05 + 0.1, duration: 0.2 }}
                        />
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      <TimelineEventForm
        open={showForm}
        onOpenChange={setShowForm}
        event={editingEvent}
        onSubmit={handleSubmit}
        isPending={createEvent.isPending || updateEvent.isPending}
      />

      <AlertDialog open={!!deletingEvent} onOpenChange={() => setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Evento?</AlertDialogTitle>
            <AlertDialogDescription>
              O evento "{deletingEvent?.title}" será removido permanentemente da timeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
