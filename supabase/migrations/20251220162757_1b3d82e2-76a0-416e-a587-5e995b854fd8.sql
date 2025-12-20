-- Allow players to update their own combatant (HP, conditions)
CREATE POLICY "Players can update own combatant"
  ON public.combatants
  FOR UPDATE
  USING (
    character_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = combatants.character_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    character_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = combatants.character_id
      AND c.user_id = auth.uid()
    )
  );