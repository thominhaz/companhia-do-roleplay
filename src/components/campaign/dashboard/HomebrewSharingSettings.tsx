import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Hammer, Check, X, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface HomebrewSharingSettingsProps {
  campaign: {
    id: string;
    homebrew_sharing_policy?: string;
  };
}

type SharingPolicy = 'disabled' | 'enabled' | 'approval_required';

const policyOptions: { value: SharingPolicy; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'disabled',
    label: 'Desativado',
    description: 'Apenas você pode compartilhar homebrew',
    icon: <X className="w-4 h-4" />,
  },
  {
    value: 'approval_required',
    label: 'Com Aprovação',
    description: 'Jogadores podem solicitar, você aprova',
    icon: <Clock className="w-4 h-4" />,
  },
  {
    value: 'enabled',
    label: 'Liberado',
    description: 'Jogadores premium podem compartilhar livremente',
    icon: <Check className="w-4 h-4" />,
  },
];

export function HomebrewSharingSettings({ campaign }: HomebrewSharingSettingsProps) {
  const queryClient = useQueryClient();
  const currentPolicy = (campaign.homebrew_sharing_policy as SharingPolicy) || 'disabled';
  const [selectedPolicy, setSelectedPolicy] = useState<SharingPolicy>(currentPolicy);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = selectedPolicy !== currentPolicy;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ homebrew_sharing_policy: selectedPolicy })
        .eq('id', campaign.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['master-campaigns'] });
      toast.success('Política de compartilhamento atualizada!');
    } catch (error) {
      toast.error('Erro ao atualizar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Hammer className="w-4 h-4 text-muted-foreground" />
        <h4 className="font-medium text-sm">Compartilhamento de Homebrew</h4>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Controle se jogadores com plano Mestre podem compartilhar seus homebrew no compêndio da campanha.
      </p>

      <div className="grid gap-2">
        {policyOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedPolicy(option.value)}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
              selectedPolicy === option.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "mt-0.5 p-1.5 rounded-full",
              selectedPolicy === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium text-sm",
                selectedPolicy === option.value && "text-primary"
              )}>
                {option.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {option.description}
              </p>
            </div>
            {selectedPolicy === option.value && (
              <Check className="w-4 h-4 text-primary mt-1" />
            )}
          </button>
        ))}
      </div>

      {hasChanges && (
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
          size="sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Alterações'
          )}
        </Button>
      )}
    </div>
  );
}
