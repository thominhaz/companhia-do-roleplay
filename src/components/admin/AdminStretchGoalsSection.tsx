import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  useStretchGoals,
  useCampaignFunding,
  useUpdateStretchGoal,
  useCreateStretchGoal,
  useDeleteStretchGoal,
  useUpdateCampaignFunding,
  StretchGoal,
} from "@/hooks/useStretchGoals";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Circle,
  DollarSign,
  Save,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PHASES = [
  { name: "FUNDAÇÃO", emoji: "🏰", order: 1 },
  { name: "EXPANSÃO", emoji: "🛠️", order: 2 },
  { name: "INOVAÇÃO", emoji: "🔮", order: 3 },
  { name: "EXPERIÊNCIA IMERSIVA", emoji: "🎭", order: 4 },
  { name: "MESA VIRTUAL", emoji: "🗺️", order: 5 },
];

export default function AdminStretchGoalsSection() {
  const { data: goals, isLoading: goalsLoading } = useStretchGoals();
  const { data: funding, isLoading: fundingLoading } = useCampaignFunding();
  const updateGoal = useUpdateStretchGoal();
  const createGoal = useCreateStretchGoal();
  const deleteGoal = useDeleteStretchGoal();
  const updateFunding = useUpdateCampaignFunding();

  const [editingGoal, setEditingGoal] = useState<StretchGoal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [fundingAmount, setFundingAmount] = useState<number>(0);

  const handleSaveGoal = async (goal: Partial<StretchGoal>) => {
    if (editingGoal) {
      await updateGoal.mutateAsync({ id: editingGoal.id, ...goal });
      setEditingGoal(null);
    } else if (isCreating) {
      const maxNumber = Math.max(...(goals?.map(g => g.goal_number) || [0]), 0);
      const maxSort = Math.max(...(goals?.map(g => g.sort_order) || [0]), 0);
      await createGoal.mutateAsync({
        goal_number: maxNumber + 1,
        sort_order: maxSort + 1,
        value: goal.value || 0,
        title: goal.title || "",
        subtitle: goal.subtitle || null,
        description: goal.description || null,
        phase: goal.phase || "FUNDAÇÃO",
        phase_emoji: goal.phase_emoji || "🏰",
        phase_order: goal.phase_order || 1,
        status: (goal.status as "completed" | "current" | "pending") || "pending",
      });
      setIsCreating(false);
    }
  };

  const handleUpdateFunding = async () => {
    if (funding) {
      await updateFunding.mutateAsync({
        id: funding.id,
        current_amount: fundingAmount,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "current":
        return <Clock className="h-4 w-4 text-solar-orange" />;
      default:
        return <Circle className="h-4 w-4 text-white/30" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Concluída</Badge>;
      case "current":
        return <Badge className="bg-solar-orange/20 text-solar-orange border-solar-orange/30">Em Andamento</Badge>;
      default:
        return <Badge variant="outline" className="text-white/50">Futura</Badge>;
    }
  };

  const groupedGoals = goals?.reduce((acc, goal) => {
    if (!acc[goal.phase]) acc[goal.phase] = [];
    acc[goal.phase].push(goal);
    return acc;
  }, {} as Record<string, StretchGoal[]>) || {};

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Stretch Goals do Catarse</h2>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {/* Funding Card */}
      <Card className="p-6 bg-gradient-to-r from-cosmic-purple/20 to-solar-orange/20 border-cosmic-purple/30">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="h-6 w-6 text-solar-orange" />
          <h3 className="text-lg font-bold">Financiamento Atual</h3>
        </div>
        
        {fundingLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : funding ? (
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Valor Arrecadado (R$)</Label>
              <Input
                type="number"
                defaultValue={funding.current_amount}
                onChange={(e) => setFundingAmount(Number(e.target.value))}
                className="text-2xl font-bold"
              />
            </div>
            <div className="text-center px-4">
              <span className="text-muted-foreground">de</span>
            </div>
            <div className="flex-1">
              <Label>Meta Final</Label>
              <div className="text-2xl font-bold text-muted-foreground">
                R$ {funding.goal_amount.toLocaleString("pt-BR")}
              </div>
            </div>
            <Button
              onClick={handleUpdateFunding}
              disabled={updateFunding.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Goals List */}
      {goalsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        PHASES.map((phase) => (
          <div key={phase.name} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{phase.emoji}</span>
              <h3 className="text-lg font-bold">{phase.name}</h3>
              <Badge variant="outline" className="ml-2">
                {groupedGoals[phase.name]?.length || 0} metas
              </Badge>
            </div>

            <div className="grid gap-3">
              {groupedGoals[phase.name]?.map((goal) => (
                <Card
                  key={goal.id}
                  className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(goal.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-muted-foreground">
                            #{goal.goal_number}
                          </span>
                          <h4 className="font-semibold">{goal.title}</h4>
                          {getStatusBadge(goal.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {goal.subtitle}
                        </p>
                        <div className="text-solar-orange font-bold mt-2">
                          R$ {goal.value.toLocaleString("pt-BR")}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingGoal(goal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-400"
                        onClick={() => setDeleteConfirm(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Edit/Create Sheet */}
      <GoalEditSheet
        goal={editingGoal}
        isOpen={!!editingGoal || isCreating}
        onClose={() => {
          setEditingGoal(null);
          setIsCreating(false);
        }}
        onSave={handleSaveGoal}
        isLoading={updateGoal.isPending || createGoal.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A meta será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (deleteConfirm) {
                  deleteGoal.mutate(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface GoalEditSheetProps {
  goal: StretchGoal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Partial<StretchGoal>) => void;
  isLoading: boolean;
}

function GoalEditSheet({ goal, isOpen, onClose, onSave, isLoading }: GoalEditSheetProps) {
  const [formData, setFormData] = useState<Partial<StretchGoal>>({});

  const handleOpen = () => {
    if (goal) {
      setFormData(goal);
    } else {
      setFormData({
        value: 0,
        title: "",
        subtitle: "",
        description: "",
        phase: "FUNDAÇÃO",
        phase_emoji: "🏰",
        phase_order: 1,
        status: "pending",
      });
    }
  };

  const handlePhaseChange = (phaseName: string) => {
    const phase = PHASES.find((p) => p.name === phaseName);
    if (phase) {
      setFormData({
        ...formData,
        phase: phase.name,
        phase_emoji: phase.emoji,
        phase_order: phase.order,
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (open) handleOpen();
      else onClose();
    }}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{goal ? "Editar Meta" : "Nova Meta"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div>
            <Label>Título</Label>
            <Input
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nome da meta"
            />
          </div>

          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              value={formData.value || 0}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              placeholder="0"
            />
          </div>

          <div>
            <Label>Subtítulo</Label>
            <Input
              value={formData.subtitle || ""}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Breve descrição"
            />
          </div>

          <div>
            <Label>Descrição Completa</Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição detalhada da meta"
              rows={4}
            />
          </div>

          <div>
            <Label>Fase</Label>
            <Select value={formData.phase} onValueChange={handlePhaseChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHASES.map((phase) => (
                  <SelectItem key={phase.name} value={phase.name}>
                    {phase.emoji} {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as "completed" | "current" | "pending" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Concluída
                  </div>
                </SelectItem>
                <SelectItem value="current">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-solar-orange" />
                    Em Andamento
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-white/30" />
                    Futura
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={() => onSave(formData)}
              disabled={isLoading || !formData.title || !formData.value}
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
