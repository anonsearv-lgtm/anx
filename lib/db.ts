import postgres from 'postgres';

let sql: ReturnType<typeof postgres> | null = null;
export function db() {
  if (!sql) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
    sql = postgres(process.env.DATABASE_URL, { max: 5, prepare: false });
  }
  return sql;
}

let schemaReady: Promise<void> | null = null;
export function ensureSchema() {
  if (!schemaReady) schemaReady = migrate();
  return schemaReady;
}

async function migrate() {
  const s = db();
  await s`CREATE TABLE IF NOT EXISTS users (id BIGSERIAL PRIMARY KEY, session_key TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL)`;
  await s`CREATE TABLE IF NOT EXISTS projects (id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL)`;
  await s`CREATE TABLE IF NOT EXISTS assets (id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL, kind TEXT NOT NULL, original_name TEXT NOT NULL, path TEXT NOT NULL, mime TEXT NOT NULL, size_bytes BIGINT NOT NULL DEFAULT 0, source TEXT NOT NULL DEFAULT 'upload', created_at TIMESTAMPTZ NOT NULL)`;
  await s`CREATE TABLE IF NOT EXISTS generations (id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL, workspace TEXT NOT NULL, model TEXT NOT NULL, prompt TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'queued', provider_job_id TEXT, input_asset_ids JSONB NOT NULL DEFAULT '[]'::jsonb, output_asset_id BIGINT REFERENCES assets(id) ON DELETE SET NULL, error_message TEXT, metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL)`;
  await s`CREATE TABLE IF NOT EXISTS prompts (id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, body TEXT NOT NULL, workspace TEXT, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL)`;
  await s`CREATE TABLE IF NOT EXISTS notifications (id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, generation_id BIGINT REFERENCES generations(id) ON DELETE CASCADE, read_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL)`;
  await s`CREATE TABLE IF NOT EXISTS realtime_sessions (id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, workspace TEXT NOT NULL, model TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'idle', provider_session_id TEXT, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ, error_message TEXT, metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL)`;
  await s`CREATE TABLE IF NOT EXISTS model_config (id BIGSERIAL PRIMARY KEY, workspace TEXT UNIQUE NOT NULL, model_id TEXT NOT NULL, endpoint_kind TEXT NOT NULL, enabled BOOLEAN NOT NULL DEFAULT TRUE, updated_at TIMESTAMPTZ NOT NULL)`;
  const defaults = [['realtime','lucy-2.5','realtime'],['image','lucy-image-latest','image'],['video','lucy-latest','video'],['vton','lucy-2.1-vton','video'],['restyle','lucy-restyle-2','video']] as const;
  for (const [workspace, model, kind] of defaults) await s`INSERT INTO model_config(workspace,model_id,endpoint_kind,enabled,updated_at) VALUES(${workspace},${model},${kind},true,now()) ON CONFLICT (workspace) DO UPDATE SET model_id=EXCLUDED.model_id, endpoint_kind=EXCLUDED.endpoint_kind, enabled=true, updated_at=now()`;
}
