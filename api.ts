import { safeRead } from "./safe-read";
export const PUBLIC_PREVIEW=import.meta.env.VITE_PUBLIC_PREVIEW === 'true';
let csrf = "";
// Minimal request-status store. No change to network routing, credentials or API shape.
let backendRequests = 0;
const backendListeners = new Set<() => void>();
export const getBackendActivity = () => backendRequests;
export function subscribeBackendActivity(listener: () => void) {
  backendListeners.add(listener);
  return () => { backendListeners.delete(listener); };
}
function changeBackendActivity(delta: number) {
  backendRequests = Math.max(0, backendRequests + delta);
  backendListeners.forEach(listener => listener());
}

export async function initAuth() {
  if(PUBLIC_PREVIEW)return {authenticated:false,username:'',csrf:''};
  changeBackendActivity(1);
  try {
    const d = await safeRead("/api/auth/");
    if (typeof d.csrf !== "string") throw Error("Unable to establish a secure session.");
    csrf = d.csrf;
    return d;
  } finally {
    changeBackendActivity(-1);
  }
}
export async function api(path: string, method = "GET", body?: unknown) {
  if(PUBLIC_PREVIEW){
    if(path==='public/'&&method==='GET'){
      const r=await fetch('/company-preview.json',{cache:'no-store'});
      if(!r.ok)throw Error('Unable to load the company preview.');
      return r.json();
    }
    throw Error('The owner workspace requires the connected company server.');
  }
  changeBackendActivity(1);
  try {
  if (path === "public/" && method === "GET") return await safeRead("/api/public/");
  if (method !== "GET" && !csrf) await initAuth();
  const r = await fetch("/api/" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (r.status === 204) return null;
  const d = await r
    .json()
    .catch(() => ({ detail: "The server returned an unexpected response." }));
  if (!r.ok) throw Error(flatten(d));
  if (d.csrf) csrf = d.csrf;
  return d;
  } finally {
    changeBackendActivity(-1);
  }
}
function flatten(d: unknown, prefix = ""): string {
  if (typeof d === "string") return prefix + d;
  if (Array.isArray(d))
    return d
      .map((v, i) =>
        flatten(v, prefix + (typeof v === "object" ? `${i + 1}: ` : "")),
      )
      .join(" ");
  if (d && typeof d === "object")
    return Object.entries(d)
      .map(([k, v]) =>
        flatten(
          v,
          k === "detail" ? "" : prefix + k.replaceAll("_", " ") + ": ",
        ),
      )
      .join("\n");
  return String(d);
}
export async function upload(
  file: File,
  onProgress: (p: number) => void,
): Promise<Asset> {
  if (!csrf) await initAuth();
  changeBackendActivity(1);
  return new Promise<Asset>((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("POST", "/api/owner/media/");
    x.setRequestHeader("X-CSRFToken", csrf);
    x.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    x.onload = () => {
      try {
        const d = JSON.parse(x.responseText);
        if (x.status >= 200 && x.status < 300) resolve(d);
        else reject(Error(flatten(d)));
      } catch {
        reject(Error("Upload failed."));
      }
    };
    x.onerror = () =>
      reject(
        Error(
          "Connection interrupted. Check the media library before retrying.",
        ),
      );
    x.timeout = 240000;
    x.ontimeout = () =>
      reject(
        Error("Upload timed out. Check the media library before retrying."),
      );
    const data = new FormData();
    data.append("file", file);
    x.send(data);
  }).finally(() => changeBackendActivity(-1));
}
export type Asset = {
  id: number;
  name: string;
  kind: "image" | "video" | "document";
  url: string;
  responsive?: Record<string, string>;
  alt: string;
  caption: string;
  gallery?: boolean;
  order?: number;
  references?: { content: number[]; documents: number[]; settings: string[] };
};
export type Attachment = {
  media?: number;
  asset?: Asset;
  alt: string;
  caption: string;
  cover: boolean;
  order?: number;
};
export type Item = {
  id?: number;
  kind: "service" | "project";
  title: string;
  slug: string;
  summary: string;
  body: string;
  published: boolean;
  order: number;
  attachments: Attachment[];
};
export type Row = Record<string, string | boolean | number | null>;
export type Company = Record<string, unknown> & {
  official_name?: string;
  tagline?: string;
  trading_name?: string;
  registration_number?: string;
  short_intro?: string;
  description?: string;
  mission?: string;
  vision?: string;
  values?: string;
  whatsapp?: string;
  whatsapp_message?: string;
  timezone?: string;
  holiday_notice?: string;
  ceo_name?: string;
  ceo_position?: string;
  ceo_bio?: string;
  ceo_message?: string;
  footer_description?: string;
  copyright_owner?: string;
  seo_title?: string;
  seo_description?: string;
  privacy_text?: string;
  year_established?: number | null;
  primary_email?: string;
  phones?: Row[];
  emails?: Row[];
  offices?: Row[];
  socials?: Row[];
  additional?: Row[];
  hours?: Row[];
  logo?: Asset | number | null;
  favicon?: Asset | number | null;
  ceo_photo?: Asset | number | null;
  sharing_image?: Asset | number | null;
};
export type Doc = {
  id?: number;
  title: string;
  media: number;
  asset?: Asset;
  public: boolean;
  profile: boolean;
  order: number;
};
export type PublicData = {
  company: Company;
  content: Item[];
  gallery: Asset[];
  documents: Doc[];
};
