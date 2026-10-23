import { createContext, useContext } from "react";
import { Download } from "lucide-react";
import { PublicData, Asset } from "./api";
export const DataContext = createContext<{
  data: PublicData;
  refresh: () => Promise<void>;
}>({
  data: { company: {}, content: [], gallery: [], documents: [] },
  refresh: async () => {},
});
export const useData = () => useContext(DataContext);
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
  if (!asset?.url) return null;
  return (
    <figure>
      {asset.kind === "video" ? (
        <video
          controls
          preload="metadata"
          src={asset.url}
          aria-label={alt || asset.alt || asset.name}
        >
          Your browser cannot play this video.{" "}
          <a href={asset.url}>Download video</a>
        </video>
      ) : asset.kind === "image" ? (
        <img
          loading="lazy"
          src={asset.responsive?.["960"] || asset.url}
          srcSet={
            asset.responsive
              ? Object.entries(asset.responsive)
                  .map(([w, u]) => `${u} ${w}w`)
                  .join(",")
              : undefined
          }
          sizes="(max-width: 700px) 100vw, 50vw"
          alt={alt || asset.alt || ""}
        />
      ) : (
        <a href={asset.url} target="_blank" rel="noreferrer">
          Open PDF <Download size={16} />
        </a>
      )}
      {(caption || asset.caption) && (
        <figcaption>{caption || asset.caption}</figcaption>
      )}
    </figure>
  );
}
