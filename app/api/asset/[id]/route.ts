import { NextRequest } from 'next/server';
import { readPrivate } from '../../../../lib/blob';
import { db, ensureSchema } from '../../../../lib/db';
import { getUser } from '../../../../lib/auth';

export const runtime = 'nodejs';
export async function GET(_req: NextRequest, { params }: { params: Promise<{id:string}> }) {
  try { await ensureSchema(); const user=await getUser(); const {id}=await params; const s=db(); const rows=await s`SELECT path,mime FROM assets WHERE id=${Number(id)} AND user_id=${user.id}`; if(!rows.length) return new Response('Not found',{status:404}); const r=await readPrivate(rows[0].path as string); if(!r || r.statusCode!==200) return new Response('Not found',{status:404}); return new Response(r.stream,{headers:{'Content-Type':String(r.blob.contentType||rows[0].mime),'Cache-Control':'private, max-age=60','X-Content-Type-Options':'nosniff'}}); }
  catch(e:any){ return Response.json({error:e?.message||'Asset error'},{status:500}); }
}
