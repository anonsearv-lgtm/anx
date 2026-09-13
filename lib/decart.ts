const BASE = process.env.DECART_API_BASE || 'https://api.decart.ai';
const KEY = process.env.DECART_API_KEY || '';
const models = { realtime: process.env.DECART_REALTIME_MODEL || 'lucy-2.5', image: process.env.DECART_IMAGE_MODEL || 'lucy-image-latest', video: process.env.DECART_VIDEO_MODEL || 'lucy-latest', vton: process.env.DECART_VTON_MODEL || 'lucy-2.1-vton', restyle: process.env.DECART_RESTYLE_MODEL || 'lucy-restyle-2' } as const;
export { models };
function requireKey(){ if(!KEY) throw new Error('DECART_API_KEY is not configured.'); }
function headers(){ return { 'X-API-KEY': KEY }; }
export async function clientToken(origin:string){ requireKey(); const r=await fetch(`${BASE}/v1/client/tokens`,{method:'POST',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({expiresIn:600,allowedModels:[models.realtime],allowedOrigins:[origin],constraints:{realtime:{maxSessionDuration:900}},metadata:{app:'ANONYMOUX_STUDIO'}})}); if(!r.ok) throw new Error(`Unable to create realtime token (${r.status}).`); return r.json(); }
export async function generateImage(model:string,input:Blob,inputName:string,inputType:string,prompt:string,ref?:Blob,refName='reference.png',refType='image/png',resolution='720p'){
 requireKey(); const f=new FormData(); f.append('prompt',prompt); f.append('resolution',resolution); f.append('data',new File([input],inputName,{type:inputType})); if(ref) f.append('reference_image',new File([ref],refName,{type:refType})); const r=await fetch(`${BASE}/v1/generate/${encodeURIComponent(model)}`,{method:'POST',headers:headers(),body:f}); if(!r.ok) throw new Error(await providerError(r,'Image generation failed')); return r;
}
export async function submitVideo(model:string,input:Blob,inputName:string,inputType:string,prompt:string,ref?:Blob,refName='reference.png',refType='image/png'){
 requireKey(); const f=new FormData(); f.append('data',new File([input],inputName,{type:inputType})); f.append('prompt',prompt); f.append('resolution','720p'); f.append('enhance_prompt','true'); if(ref) f.append('reference_image',new File([ref],refName,{type:refType})); const r=await fetch(`${BASE}/v1/jobs/${encodeURIComponent(model)}`,{method:'POST',headers:headers(),body:f}); const j=await r.json().catch(()=>null); if(!r.ok||!j) throw new Error(await providerError(r,'Video generation submission failed')); return j;
}
export async function getJob(jobId:string){ requireKey(); const r=await fetch(`${BASE}/v1/jobs/${encodeURIComponent(jobId)}`,{headers:headers(),cache:'no-store'}); const j=await r.json().catch(()=>null); if(!r.ok||!j) throw new Error(await providerError(r,'Unable to read generation status')); return j; }
export async function getContent(jobId:string){ requireKey(); const r=await fetch(`${BASE}/v1/jobs/${encodeURIComponent(jobId)}/content`,{headers:headers(),cache:'no-store'}); if(!r.ok) throw new Error(await providerError(r,'Unable to download generation result')); return r; }
async function providerError(r:Response,fallback:string){ const j=await r.clone().json().catch(()=>null) as any; return j?.detail || j?.message || (typeof j?.error==='string'?j.error:null) || fallback; }
