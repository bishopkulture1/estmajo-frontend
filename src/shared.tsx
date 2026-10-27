import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { PublicData, Asset, getBackendActivity, subscribeBackendActivity } from "./api";
export const DataContext = createContext<{
  data: PublicData;
  refresh: () => Promise<void>;
  pending: boolean;
  loadError: string;
  backendReady: boolean;
}>({
  data: { company: {}, content: [], gallery: [], documents: [] },
  refresh: async () => {},
  pending: false, loadError: "", backendReady: false,
});
export const useData = () => useContext(DataContext);
// A small indicator appears during any live Django API request, without blocking static pages.
export function BackendActivity() {
  const active = useSyncExternalStore(subscribeBackendActivity, getBackendActivity, () => 0);
  if (active === 0) return null;
  return <aside className="backend-activity" aria-label="Waiting for company server"><BrandLoading compact label="LOADING…" /></aside>;
}

export function BrandLoading({label="LOADING…", compact=false}: {label?:string;compact?:boolean}) {
  return <div className={"estmajo-loader"+(compact?" compact":"")} role="status" aria-live="polite" aria-label={label}>
    <img src="/brand/estmajo-logo.jpg" alt="" width="68" height="68" />
    <strong>{label}</strong>
  </div>;
}
export const text = (v: unknown) => (typeof v === "string" ? v : "");
export function MediaView({
  asset,
  alt,
  caption,
}: {
  asset?: Asset;
  alt?: string;
  caption?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [asset?.url]);
  if (!asset?.url) return <p className="media-error" role="alert">This media is not available yet. Check ImageKit configuration and refresh the media library.</p>;
  return (
    <figure>
      {asset.kind === "video" ? (
        <video
          controls
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
          src={asset.url}
          aria-label={alt || asset.alt || asset.name}
        >
          Your browser cannot play this video.{" "}
          <a href={asset.url}>Download video</a>
        </video>
      ) : asset.kind === "image" ? (
        <img
          loading="eager"
          onError={() => setFailed(true)}
          src={asset.url}
          alt={alt || asset.alt || ""}
        />
      ) : (
        <a href={asset.url} target="_blank" rel="noreferrer">
          Open PDF <Download size={16} />
        </a>
      )}
      {failed && <p className="media-error" role="alert">Cannot display this file. Refresh to obtain a new secure media link and check ImageKit delivery settings.</p>}
      {(caption || asset.caption) && (
        <figcaption>{caption || asset.caption}</figcaption>
      )}
    </figure>
  );
}
