import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { CombatTracker } from "../CombatTracker";
import { PlayerCombatView } from "../PlayerCombatView";
import { PreparedEncounterSheet } from "../PreparedEncounterSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Swords, Plus, Play, Trash2, Edit, Skull, Heart, Shield, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  usePreparedEncounters,
  useDraftCombatants,
  useStartPreparedEncounter,
  useDeleteDraftEncounter,
  PreparedEncounter,
} from "@/hooks/usePreparedEncounters";
import { toast } from "sonner";
import { useAddCombatLog } from "@/hooks/useCombatLogs";
import { useCampaignPlayers } from "@/hooks/useSessions";

interface DashboardCombatProps {
  campaign: CampaignDB;
  isMaster: boolean;
}

function PreparedEncounterCard({
  encounter,
  campaignId,
  onEdit,
  onStart,
  onDelete,
}: {
  encounter: PreparedEncounter;
  campaignId: string;
  onEdit: () => void;
  onStart: () => void;
  onDelete: () => void;
}) {
  const { data: combatants } = useDraftCombatants(encounter.id);
  const { data: players } = useCampaignPlayers(campaignId);

  const monsterCount = combatants?.filter(c => !c.is_player).length || 0;
  const preSelectedCount = encounter.pre_selected_player_ids?.length || 0;

  return (
    <div className="bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{encounter.name}</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Skull className="w-3 h-3" /> {monsterCount} inimigo{monsterCount !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <Users className="w-3 h-3" /> {preSelectedCount} jogador{preSelectedCount !== 1 ? 'es' : ''}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
      <Button
        onClick={onStart}
        variant="destructive"
        size="sm"
        className="w-full mt-3 gap-2"
        disabled={monsterCount === 0}
      >
        <Play className="w-4 h-4" /> Iniciar Combate
      </Button>
    </div>
  );
}

export function DashboardCombat({ campaign, isMaster }: DashboardCombatProps) {
  const [showCombatTracker, setShowCombatTracker] = useState(false);
  const [showPlayerCombat, setShowPlayerCombat] = useState(false);
  const [showPrepareSheet, setShowPrepareSheet] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState<PreparedEncounter | null>(null);

  const { data: preparedEncounters } = usePreparedEncounters(campaign.id);
  const startPrepared = useStartPreparedEncounter();
  const deleteDraft = useDeleteDraftEncounter();
  const addCombatLog = useAddCombatLog();
  const { data: players } = useCampaignPlayers(campaign.id);

  const { data: lastEncounter } = useQuery({
    queryKey: ['last-encounter', campaign.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('combat_encounters')
        .select('id, name, round, is_active, created_at')
        .eq('campaign_id', campaign.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const handleStartPrepared = async (encounter: PreparedEncounter) => {
    try {
      // Add pre-selected players as combatants before starting
      if (encounter.pre_selected_player_ids?.length) {
        const playersToAdd = players?.filter(
          p => p.character_id && encounter.pre_selected_player_ids.includes(p.character_id)
        ) || [];

        for (const player of playersToAdd) {
          // Check if player is already added as combatant
          const { data: existing } = await supabase
            .from('combatants')
            .select('id')
            .eq('encounter_id', encounter.id)
            .eq('character_id', player.character_id)
            .maybeSingle();

          if (!existing && player.character) {
            await supabase.from('combatants').insert({
              encounter_id: encounter.id,
              name: player.character.name,
              initiative: Math.floor(Math.random() * 20) + 1,
              current_hp: 10,
              max_hp: 10,
              armor_class: 10,
              is_player: true,
              character_id: player.character_id,
              conditions: [],
              notes: null,
              sort_order: 0,
            });
          }
        }
      }

      const result = await startPrepared.mutateAsync({
        encounterId: encounter.id,
        campaignId: campaign.id,
      });

      // Log combat start
      await addCombatLog.mutateAsync({
        encounter_id: result.id,
        combatant_id: null,
        action_type: 'combat_start',
        value: null,
        details: null,
        combatant_name: null,
      });

      setShowCombatTracker(true);
    } catch {
      // error handled by hook
    }
  };

  if (isMaster) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Combate</h2>
            <p className="text-sm text-muted-foreground">Gerencie encontros e iniciativa</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowPrepareSheet(true)} variant="outline" className="gap-2" size="sm">
              <Plus className="w-4 h-4" />
              Preparar
            </Button>
            <Button onClick={() => setShowCombatTracker(true)} variant="destructive" className="gap-2" size="sm">
              <Swords className="w-4 h-4" />
              Tracker
            </Button>
          </div>
        </div>

        {/* Prepared Encounters */}
        {preparedEncounters && preparedEncounters.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Encontros Preparados
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {preparedEncounters.map(enc => (
                <PreparedEncounterCard
                  key={enc.id}
                  encounter={enc}
                  campaignId={campaign.id}
                  onEdit={() => {
                    setEditingEncounter(enc);
                    setShowPrepareSheet(true);
                  }}
                  onStart={() => handleStartPrepared(enc)}
                  onDelete={() => deleteDraft.mutate({ id: enc.id, campaignId: campaign.id })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Last encounter info */}
        <div className="bg-card rounded-xl p-6 border border-border text-center">
          <Swords className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Combat Tracker</h3>
          <p className="text-sm text-muted-foreground">
            {lastEncounter
              ? `Último encontro: ${lastEncounter.name} — ${lastEncounter.is_active ? `Ativo (Rodada ${lastEncounter.round})` : 'Finalizado'}`
              : 'Gerencie encontros, iniciativa, HP e condições dos combatentes em tempo real.'
            }
          </p>
        </div>

        <CombatTracker
          campaignId={campaign.id}
          open={showCombatTracker}
          onOpenChange={setShowCombatTracker}
        />

        <PreparedEncounterSheet
          campaignId={campaign.id}
          encounter={editingEncounter}
          open={showPrepareSheet}
          onOpenChange={(open) => {
            setShowPrepareSheet(open);
            if (!open) setEditingEncounter(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Combate</h2>
          <p className="text-sm text-muted-foreground">Acompanhe o combate em tempo real</p>
        </div>
        <Button onClick={() => setShowPlayerCombat(true)} variant="outline" className="gap-2">
          <Swords className="w-4 h-4" />
          Ver Combate
        </Button>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border text-center">
        <Swords className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="font-semibold mb-2">Visualização de Combate</h3>
        <p className="text-sm text-muted-foreground">
          Acompanhe a ordem de iniciativa e o status dos combatentes durante o combate.
        </p>
      </div>

      <PlayerCombatView
        campaignId={campaign.id}
        open={showPlayerCombat}
        onOpenChange={setShowPlayerCombat}
      />
    </div>
  );
}
