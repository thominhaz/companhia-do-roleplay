import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "./useSubscription";
import { toast } from "sonner";

interface DiceRollData {
  username?: string;
  characterName?: string;
  diceType: string;
  diceCount: number;
  modifier: number;
  results: number[];
  total: number;
  isCritical?: boolean;
  isCriticalFail?: boolean;
}

interface SessionReminderData {
  sessionTitle: string;
  sessionDate: string;
}

interface CombatData {
  combatName?: string;
}

interface CustomNotificationData {
  customTitle?: string;
  customMessage: string;
}

type NotificationType = 'dice_roll' | 'session_reminder' | 'combat_start' | 'combat_end' | 'custom';

type NotificationData = DiceRollData | SessionReminderData | CombatData | CustomNotificationData;

export function useDiscordNotification() {
  const subscriptionQuery = useSubscription();

  const sendNotification = async (
    campaignId: string,
    type: NotificationType,
    data: NotificationData
  ): Promise<boolean> => {
    // Only available for Mestre tier
    if (!subscriptionQuery.data?.limits.hasDiscordIntegration) {
      return false;
    }

    try {
      const { data: response, error } = await supabase.functions.invoke('send-discord-notification', {
        body: { campaignId, type, data },
      });

      if (error) {
        console.error('Error sending Discord notification:', error);
        return false;
      }

      if (response?.success) {
        return true;
      }

      // No webhook configured - silently fail
      if (response?.message === 'No Discord webhook configured') {
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error sending Discord notification:', error);
      return false;
    }
  };

  const sendDiceRoll = async (campaignId: string, data: DiceRollData) => {
    return sendNotification(campaignId, 'dice_roll', data);
  };

  const sendSessionReminder = async (campaignId: string, data: SessionReminderData) => {
    return sendNotification(campaignId, 'session_reminder', data);
  };

  const sendCombatStart = async (campaignId: string, data: CombatData) => {
    return sendNotification(campaignId, 'combat_start', data);
  };

  const sendCombatEnd = async (campaignId: string, data: CombatData) => {
    return sendNotification(campaignId, 'combat_end', data);
  };

  const sendCustomNotification = async (campaignId: string, data: CustomNotificationData) => {
    return sendNotification(campaignId, 'custom', data);
  };

  return {
    sendDiceRoll,
    sendSessionReminder,
    sendCombatStart,
    sendCombatEnd,
    sendCustomNotification,
    hasDiscordIntegration: subscriptionQuery.data?.limits.hasDiscordIntegration ?? false,
  };
}
