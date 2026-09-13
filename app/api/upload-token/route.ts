import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { db, ensureSchema } from '../../../lib/db';
import { getUser } from '../../../lib/auth';

export const runtime = 'nodejs';
const allowed = ['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'];

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    const user = await getUser();
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let payload: any = {};
        try { payload = JSON.parse(clientPayload || '{}'); } catch {}
        return {
          allowedContentTypes: allowed,
          addRandomSuffix: false,
          access: 'private',
          tokenPayload: JSON.stringify({ userId: user.id, kind: String(payload.kind || 'creative'), projectId: Number(payload.projectId || 0), originalName: String(payload.originalName || 'upload') }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || '{}');
        if (Number(payload.userId) !== user.id) throw new Error('Upload owner mismatch');
        const projectId = Number(payload.projectId || 0);
        const rows = await db()`SELECT id FROM projects WHERE id=${projectId} AND user_id=${user.id}`;
        const project = rows.length ? projectId : null;
        await db()`INSERT INTO assets(user_id,project_id,kind,original_name,path,mime,size_bytes,source,created_at) VALUES(${user.id},${project},${String(payload.kind || 'creative')},${String(payload.originalName || 'upload')},${blob.pathname},${blob.contentType || 'application/octet-stream'},${Number((blob as any).size || 0)},'upload',now())`;
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
