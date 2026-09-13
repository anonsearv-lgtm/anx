import { del, get, put } from '@vercel/blob';

export async function putPrivate(pathname: string, body: Blob | string | ArrayBuffer | ReadableStream<Uint8Array>, contentType: string) {
  return put(pathname, body, { access: 'private', contentType, addRandomSuffix: false });
}
export async function readPrivate(pathname: string) {
  return get(pathname, { access: 'private' });
}
export async function deletePrivate(pathname: string) { await del(pathname); }
