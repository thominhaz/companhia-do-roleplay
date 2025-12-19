-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view campaigns" ON campaigns;
DROP POLICY IF EXISTS "Campaign members can view players" ON campaign_players;

-- Create new SELECT policy for campaigns that doesn't reference campaign_players directly
CREATE POLICY "Users can view own campaigns" 
ON campaigns 
FOR SELECT 
USING (
  auth.uid() = master_id
);

-- Create separate policy for campaigns user is playing in (using a subquery without referencing campaign_players RLS)
CREATE POLICY "Players can view joined campaigns" 
ON campaigns 
FOR SELECT 
USING (
  id IN (
    SELECT campaign_id 
    FROM campaign_players 
    WHERE user_id = auth.uid()
  )
);

-- Create new SELECT policy for campaign_players that doesn't cause recursion
DROP POLICY IF EXISTS "Campaign members can view players" ON campaign_players;

CREATE POLICY "Users can view campaign players" 
ON campaign_players 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- User is the master of the campaign (check directly on campaigns without using campaign_players)
    campaign_id IN (SELECT id FROM campaigns WHERE master_id = auth.uid())
    OR 
    -- User is a participant (direct check on same table, no cross-reference)
    user_id = auth.uid()
  )
);