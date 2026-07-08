/*
# Add Chat Sessions

1. New Tables
   - `chat_sessions`: stores one row per distinct conversation.
     - `id` (uuid, PK)
     - `user_id` (uuid, FK auth.users, defaults to auth.uid())
     - `title` (text) — auto-set from the first user message
     - `created_at`, `last_message_at` (timestamptz)

2. Modified Tables
   - `conversations`: new nullable `session_id` FK → `chat_sessions.id`.
     Existing rows keep session_id = NULL (backward-compatible).

3. Security
   - RLS enabled on `chat_sessions` with 4 owner-scoped policies (SELECT/INSERT/UPDATE/DELETE).
   - Existing `conversations` RLS policies are unchanged.
*/

CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat',
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions" ON chat_sessions;
CREATE POLICY "select_own_sessions" ON chat_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sessions" ON chat_sessions;
CREATE POLICY "insert_own_sessions" ON chat_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sessions" ON chat_sessions;
CREATE POLICY "update_own_sessions" ON chat_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sessions" ON chat_sessions;
CREATE POLICY "delete_own_sessions" ON chat_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE conversations
      ADD COLUMN session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;
