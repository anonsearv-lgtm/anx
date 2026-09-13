import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { db, ensureSchema } from './db';

export async function getUser() {
  await ensureSchema();
  const jar = await cookies();
  let session = jar.get('anon_session')?.value;
  if (!session) session = randomUUID();
  const s = db();
  const rows = await s`INSERT INTO users(session_key,created_at,updated_at) VALUES(${session},now(),now()) ON CONFLICT(session_key) DO UPDATE SET updated_at=now() RETURNING id, session_key`;
  const res = rows[0];
  if (!jar.get('anon_session')) jar.set('anon_session', session, { httpOnly:true, sameSite:'lax', secure:true, path:'/', maxAge:60*60*24*365 });
  return { id: Number(res.id), session };
}

export async function csrfToken() {
  const jar = await cookies();
  let token = jar.get('anon_csrf')?.value;
  if (!token) { token = randomUUID(); jar.set('anon_csrf', token, { httpOnly:false, sameSite:'lax', secure:true, path:'/', maxAge:60*60*24 }); }
  return token;
}
