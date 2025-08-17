-- Create activity feed table
CREATE TABLE activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('liked_item', 'added_closet', 'created_fit')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('like', 'closet_item', 'fit')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_actor_id ON activity_feed(actor_id);
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_action_type ON activity_feed(action_type);
CREATE INDEX idx_activity_feed_target ON activity_feed(target_type, target_id);

-- Enable RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own activity feed" 
ON activity_feed 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view activity from connected users" 
ON activity_feed 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_connections 
    WHERE (
      (user_connections.user_id = auth.uid() AND user_connections.connected_user_id = activity_feed.actor_id) 
      OR 
      (user_connections.connected_user_id = auth.uid() AND user_connections.user_id = activity_feed.actor_id)
    ) 
    AND user_connections.status = 'accepted'
  )
);

CREATE POLICY "System can insert activity feed entries" 
ON activity_feed 
FOR INSERT 
WITH CHECK (true);