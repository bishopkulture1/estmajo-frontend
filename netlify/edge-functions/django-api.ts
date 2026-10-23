import type { Context } from "https://edge.netlify.com";
const enc = new TextEncoder();
export default async (request: Request, context: Context): Promise<Response> => {
  const origin = Netlify.env.get("DJANGO_API_ORIGIN")?.replace(/\/+$/, "");
  const secret = Netlify.env.get("NETLIFY_PROXY_SECRET");
  if (!origin || !secret || secret.length < 32) return Response.json({detail:"API not configured"},{status:503});
  let target: URL;
  try { target = new URL(origin); if(target.protocol!=="https:" || target.pathname!=="/" || target.search || target.hash || target.username || target.password) throw Error(); }
  catch { return Response.json({detail:"Invalid backend origin"},{status:503}); }
  const incoming = new URL(request.url);
  if (!incoming.pathname.startsWith("/api/")) return context.next();
  target.pathname = incoming.pathname; target.search = incoming.search;
  const ip = context.ip;
  if (!ip) return Response.json({detail:"Client IP unavailable"},{status:503});
  const timestamp = String(Math.floor(Date.now()/1000));
  const payload = `${timestamp}\n${ip}\n${request.method}\n${incoming.pathname}`;
  const key = await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature = [...new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(payload)))].map(b=>b.toString(16).padStart(2,"0")).join("");
  const headers = new Headers();
  request.headers.forEach((v,k)=>{if(!["host","connection","content-length","transfer-encoding","x-estmajo-proxy-time","x-estmajo-proxy-ip","x-estmajo-proxy-signature"].includes(k.toLowerCase()) && !k.toLowerCase().startsWith("x-forwarded-"))headers.set(k,v);});
  headers.set("X-Estmajo-Proxy-Time",timestamp); headers.set("X-Estmajo-Proxy-IP",ip); headers.set("X-Estmajo-Proxy-Signature",signature);
  try {
    const upstream = await fetch(target.toString(),{method:request.method,headers,body:["GET","HEAD"].includes(request.method)?undefined:request.body,redirect:"manual"});
    const h = new Headers(upstream.headers); h.delete("content-length");h.delete("content-encoding");h.set("Cache-Control","private, no-store");
    return new Response(upstream.body,{status:upstream.status,headers:h});
  } catch { return Response.json({detail:"Backend temporarily unavailable"},{status:502,headers:{"Cache-Control":"no-store"}}); }
};
