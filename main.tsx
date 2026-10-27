import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Download,
  ChevronRight,
  Wind,
  Zap,
  Sun,
  Truck,
  Settings2,
  SlidersHorizontal,
  HardHat,
  Copy,
  Check,
} from "lucide-react";
import { api, initAuth, PUBLIC_PREVIEW, Asset, Company, Item, PublicData, Row } from "./api";
const Dashboard = React.lazy(() =>
  import("./owner").then((m) => ({ default: m.Dashboard })),
);
import { DataContext, useData, text, MediaView, BrandLoading, BackendActivity } from "./shared";
import { publicFallback } from "./public-fallback";
import "./styles.css";
const icons = [Wind, Zap, Sun, Truck, Settings2, SlidersHorizontal, HardHat];
function Brand({ c }: { c: Company }) {
  const name = text(c.official_name) || "ESTMAJO ENGINEERING SOLUTIONS LTD";
  const short = name.replace(/\s+ENGINEERING SOLUTIONS\s+(LTD|LIMITED)$/i, "");
  const descriptor = name.slice(short.length).trim();
  return (
    <Link className="brand" to="/" aria-label={name + " — Home"}>
      {typeof c.logo === "object" && c.logo ? (
        <img src={c.logo.url} alt="" width="64" height="64" />
      ) : (
        <span className="brand-mark" aria-hidden="true">
          E<span>↗</span>
        </span>
      )}
      <span>
        {short}
        {descriptor && <small>{descriptor}</small>}
      </span>
    </Link>
  );
}
function App() {
  const [data, setData] = useState<PublicData>(publicFallback);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api("public/"));
      setError("");
      setBackendReady(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    initAuth().catch(() => {});
    const focus = () => {
      refresh();
    };
    window.addEventListener("focus", focus);
    const interval = setInterval(focus, 300000);
    return () => {
      window.removeEventListener("focus", focus);
      clearInterval(interval);
    };
  }, [refresh]);
  return (
    <DataContext.Provider value={{ data, refresh, pending: loading, loadError: error, backendReady }}>
      <BrowserRouter>
        <ScrollAndMeta />
        <BackendActivity />
        <Routes>
          <Route
            path="/owner/*"
            element={<React.Suspense fallback={<BrandLoading label="LOADING…" />}><Dashboard /></React.Suspense>}
          />
          <Route path="*" element={<PublicSite />} />
        </Routes>
      </BrowserRouter>
    </DataContext.Provider>
  );
}
function ScrollAndMeta() {
  const loc = useLocation();
  const { data } = useData();
  useEffect(() => {
    window.scrollTo(0, 0);
    const c = data.company;
    const item = data.content.find((i) => loc.pathname.endsWith("/" + i.slug));
    document.title = item
      ? `${item.title} | ${text(c.official_name)}`
      : text(c.seo_title) || text(c.official_name) || "Engineering Solutions";
    const meta = (key: string, value: string, property = false) => {
      let e = document.querySelector<HTMLMetaElement>(
        `meta[${property ? "property" : "name"}="${key}"]`,
      );
      if (!value) {
        e?.remove();
        return;
      }
      if (!e) {
        e = document.createElement("meta");
        e.setAttribute(property ? "property" : "name", key);
        document.head.append(e);
      }
      e.content = value;
    };
    meta("description", item?.summary || text(c.seo_description));
    meta("og:title", document.title, true);
    meta("og:description", item?.summary || text(c.seo_description), true);
    meta(
      "og:image",
      typeof c.sharing_image === "object" && c.sharing_image
        ? c.sharing_image.url
        : "",
      true,
    );
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (typeof c.favicon === "object" && c.favicon) {
      if (!icon) {
        icon = document.createElement("link");
        icon.rel = "icon";
        document.head.append(icon);
      }
      icon.href = c.favicon.url;
    } else icon?.remove();
  }, [loc.pathname, data]);
  return null;
}
function PublicSite() {
  const { data, pending, loadError, backendReady, refresh } = useData();
  const c = data.company;
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const primary =
    (c.phones || []).find((p) => p.primary) || (c.phones || [])[0];
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      {PUBLIC_PREVIEW&&<div className="public-preview-banner">PUBLIC WEBSITE PREVIEW · Email enquiries open in your email app</div>}
      <div className="topbar">
        <div className="wrap">
          <span>ENGINEERING • INSTALLATION • MAINTENANCE</span>
          {c.primary_email && (
            <a href={`mailto:${c.primary_email}`}>
              <Mail size={13} />
              {c.primary_email}
            </a>
          )}
        </div>
      </div>
      <header>
        <div className="wrap header">
          <Brand c={c} />
          <button
            className="menu-btn"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav className={open ? "open" : ""} aria-label="Main navigation">
            {[
              ["/", "Home"],
              ["/about", "About us"],
              ["/services", "Services"],
              ["/projects", "Projects"],
              ["/gallery", "Gallery"],
            ].map(([p, n]) => (
              <Link
                key={p}
                className={loc.pathname === p ? "active" : ""}
                to={p}
              >
                {n}
              </Link>
            ))}
            {c.ceo_name && <Link to="/leadership">Leadership</Link>}
            <Link className="button small" to="/contact">
              Let’s talk <ArrowUpRight size={16} />
            </Link>
          </nav>
        </div>
      </header>
      <main id="main">
        {!pending && loadError && <div className="wrap backend-status" role="alert"><p>Live updates are temporarily unavailable. Showing confirmed company information; media and new projects may be missing.</p><button type="button" className="secondary small" onClick={() => void refresh()}>Retry connection</button></div>}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Listing kind="service" />} />
          <Route path="/services/:slug" element={<Detail kind="service" />} />
          <Route path="/projects" element={<Listing kind="project" />} />
          <Route path="/projects/:slug" element={<Detail kind="project" />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/leadership" element={<Leadership />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <section className="contact-strip">
        <div className="wrap">
          <div>
            <span className="eyebrow">LET’S DISCUSS YOUR NEXT PROJECT</span>
            <h2>Start with a conversation.</h2>
          </div>
          <Link className="button light" to="/contact">
            Request a quote <ArrowUpRight size={20} />
          </Link>
        </div>
      </section>
      <footer>
        <div className="wrap footer-grid">
          <div>
            <Brand c={c} />
            {c.footer_description && <p>{text(c.footer_description)}</p>}
            {c.registration_number && (
              <span className="registration-badge">
                REGISTERED COMPANY · RC {text(c.registration_number)}
              </span>
            )}
          </div>
          <div>
            <h3>Explore</h3>
            <Link to="/about">About the company</Link>
            <Link to="/services">Our services</Link>
            <Link to="/projects">Work done</Link>
            {data.documents
              .filter((d) => d.profile)
              .map((d) => (
                <a
                  key={d.id}
                  href={`/api/documents/${d.id}/download/`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {d.title} <Download size={14} />
                </a>
              ))}
          </div>
          <div>
            <h3>Get in touch</h3>
            {c.primary_email && (
              <a href={`mailto:${c.primary_email}`}>{c.primary_email}</a>
            )}
            {(c.phones || []).map((p, i) => (
              <a href={tel(p)} key={i}>
                <Phone size={13} />
                {text(p.number)}
              </a>
            ))}
            {c.offices?.[0] && (
              <address className="footer-address">
                <MapPin size={15} />
                <span>
                  {[
                    c.offices[0].address,
                    c.offices[0].city,
                    c.offices[0].region,
                    c.offices[0].country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </address>
            )}
            {c.socials?.map((s, i) => (
              <a key={i} href={text(s.url)} target="_blank" rel="noreferrer">
                {text(s.label) || "Social profile"} <ArrowUpRight size={13} />
              </a>
            ))}
            <Link to="/contact">
              Send an enquiry <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>
            © {new Date().getFullYear()}{" "}
            {text(c.copyright_owner) || text(c.official_name)}
          </span>
          <Link to="/privacy">Privacy</Link>
          <Link to="/owner">Owner login</Link>
        </div>
      </footer>
      <div className="mobile-actions">
        {primary && (
          <a href={tel(primary)}>
            <Phone size={17} /> Call us
          </a>
        )}
        <Link to="/contact">
          <Mail size={17} /> Enquire
        </Link>
      </div>
    </>
  );
}
export function tel(p: Row) {
  return `tel:${p.number}${p.extension ? ";ext=" + p.extension : ""}`;
}
function EngineeringArt() {
  return (
    <div className="engineering-art" aria-hidden="true">
      <div className="art-grid" />
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="tower t1" />
      <div className="tower t2" />
      <div className="tower t3" />
      <div className="pipe p1" />
      <div className="pipe p2" />
      <div className="art-label">SYSTEMS. STRUCTURES. SOLUTIONS.</div>
      <span className="cross c1">+</span>
      <span className="cross c2">+</span>
    </div>
  );
}
function Home() {
  const { data } = useData();
  const c = data.company;
  const services = data.content.filter((i) => i.kind === "service");
  const projects = data.content.filter((i) => i.kind === "project");
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <i />{" "}
              {text(c.official_name).toUpperCase() || "ENGINEERING SOLUTIONS"}
            </span>
            <h1>
              Engineering
              <br />
              solutions.
              <br />
              <em>Built around you.</em>
            </h1>
            <p>
              {text(c.short_intro) ||
                "Explore our engineering, installation, maintenance and construction services. Talk to us about the requirements of your next project."}
            </p>
            <div className="actions">
              <Link className="button" to="/services">
                Explore our services <ArrowUpRight size={19} />
              </Link>
              <Link className="text-link" to="/contact">
                Discuss your project <ArrowRight size={18} />
              </Link>
            </div>
            <div className="hero-foot">
              <span className="line" />
              <span>
                {text(c.tagline) || "ENGINEERING • ENERGY • INFRASTRUCTURE"}
              </span>
            </div>
          </div>
          {typeof c.logo === "object" && c.logo ? (
            <div className="brand-showcase">
              <div className="showcase-frame">
                <img
                  src={c.logo.url}
                  alt={text(c.official_name)}
                  width="1536"
                  height="1536"
                  fetchPriority="high"
                />
              </div>
              <div className="showcase-caption">
                <span>ENGINEERING SOLUTIONS</span>
                {c.registration_number && (
                  <span>RC {text(c.registration_number)}</span>
                )}
              </div>
            </div>
          ) : (
            <EngineeringArt />
          )}
        </div>
      </section>
      <div className="discipline-strip">
        <div className="wrap">
          <span>
            {c.offices?.[0]
              ? `${text(c.offices[0].city)}, ${text(c.offices[0].region)}`
              : "Integrated disciplines."}
          </span>
          <span>Practical solutions.</span>
          <span>
            Your project starts here. <ArrowDown />
          </span>
        </div>
      </div>
      <section className="section wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow">OUR SERVICES</span>
            <h2>
              The right expertise.
              <br />
              Across your operations.
            </h2>
          </div>
          <p>
            Explore our service areas and send an enquiry to discuss your scope,
            requirements and next steps.
          </p>
        </div>
        <ServiceCards items={services} />
      </section>
      {c.description && (
        <section className="about-band">
          <div className="wrap split">
            <div>
              <span className="eyebrow">ABOUT THE COMPANY</span>
              <h2>{text(c.official_name)}</h2>
            </div>
            <div>
              <p>{text(c.description).slice(0, 600)}</p>
              <Link className="text-link" to="/about">
                Get to know us <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}
      {projects.length > 0 && (
        <section className="section wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">OUR WORK</span>
              <h2>Projects in focus.</h2>
            </div>
            <Link to="/projects" className="text-link">
              All projects <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="project-grid">
            {projects.slice(0, 3).map((i) => (
              <ProjectCard key={i.id} item={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
function ArrowDown() {
  return <span aria-hidden="true">↓</span>;
}
export function ServiceCards({ items }: { items: Item[] }) {
  return (
    <div className="services-grid">
      {items.map((item, i) => {
        const Icon = icons[i % icons.length];
        return (
          <Link
            className="service-card"
            key={item.id || i}
            to={"/services/" + item.slug}
          >
            <div className="card-top">
              <Icon size={28} strokeWidth={1.5} />
              <span>{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3>{item.title}</h3>
            {item.summary && <p>{item.summary}</p>}
            <span className="card-link">
              Explore service <ArrowUpRight size={18} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
function PageHead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="page-head">
      <div className="wrap">
        <div className="crumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} />
          {eyebrow}
        </div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </section>
  );
}
function About() {
  const { data } = useData();
  const c = data.company;
  return (
    <>
      <PageHead
        eyebrow="ABOUT US"
        title={text(c.official_name) || "About the company"}
        description={text(c.short_intro)}
      />
      <section className="section wrap prose">
        {c.description && <p>{text(c.description)}</p>}
        {["mission", "vision", "values"].map((k) =>
          c[k] ? (
            <article key={k}>
              <h2>Our {k}</h2>
              <p>{text(c[k])}</p>
            </article>
          ) : null,
        )}
        {c.year_established && <p>Established: {String(c.year_established)}</p>}
        {c.registration_number && (
          <p>Registration number: {text(c.registration_number)}</p>
        )}
        {data.documents.length > 0 && (
          <>
            <h2>Company documents</h2>
            {data.documents.map((d) => (
              <p key={d.id}>
                <a
                  className="text-link"
                  href={`/api/documents/${d.id}/download/`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {d.title} <Download size={17} />
                </a>
              </p>
            ))}
          </>
        )}
      </section>
    </>
  );
}
function Listing({ kind }: { kind: "service" | "project" }) {
  const { data } = useData();
  const [query, setQuery] = useState("");
  const items = data.content.filter(
    (i) =>
      i.kind === kind && i.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHead
        eyebrow={kind === "service" ? "OUR SERVICES" : "WORK DONE"}
        title={
          kind === "service"
            ? "Engineering across disciplines."
            : "Our project portfolio."
        }
      />
      <section className="section wrap">
        {kind === "project" && (
          <label className="search">
            Search projects
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by project name"
            />
          </label>
        )}
        {kind === "service" ? (
          <ServiceCards items={items} />
        ) : (
          <div className="project-grid">
            {items.map((i) => (
              <ProjectCard key={i.id} item={i} />
            ))}
          </div>
        )}
        {items.length === 0 && (
          <p className="empty">
            {query
              ? "No matching projects."
              : "Published projects will appear here."}
          </p>
        )}
      </section>
    </>
  );
}
export function ProjectCard({ item }: { item: Item }) {
  return (
    <Link className="project-card" to={"/projects/" + item.slug}>
      <MediaView
        asset={
          (item.attachments.find((a) => a.cover) || item.attachments[0])?.asset
        }
      />
      <div>
        <span className="eyebrow">PROJECT</span>
        <h3>
          {item.title} <ArrowUpRight size={19} />
        </h3>
        {item.summary && <p>{item.summary}</p>}
      </div>
    </Link>
  );
}
function Detail({ kind }: { kind: "service" | "project" }) {
  const { data } = useData();
  const path = useLocation().pathname;
  const item = data.content.find(
    (i) => i.kind === kind && path.endsWith("/" + i.slug),
  );
  if (!item) return <NotFound />;
  return (
    <>
      <PageHead
        eyebrow={kind === "service" ? "OUR SERVICES" : "OUR PROJECTS"}
        title={item.title}
        description={item.summary}
      />
      <section className="section wrap detail">
        <div className="prose">
          <p>{item.body}</p>
          <div className="gallery-grid">
            {item.attachments.map((a, i) => (
              <MediaView
                key={i}
                asset={a.asset}
                alt={a.alt}
                caption={a.caption}
              />
            ))}
          </div>
        </div>
        <aside className="quote-box">
          <span className="eyebrow">LET’S TALK</span>
          <h2>Have a project in mind?</h2>
          <p>Share your requirements with our team.</p>
          <Link className="button" to={"/contact?service=" + item.id}>
            Request a quote <ArrowUpRight size={18} />
          </Link>
        </aside>
      </section>
    </>
  );
}
function Gallery() {
  const { data } = useData();
  const [filter, setFilter] = useState("all");
  return (
    <>
      <PageHead eyebrow="MEDIA GALLERY" title="A closer look at our work." />
      <section className="section wrap">
        <div className="tabs" role="group" aria-label="Filter gallery">
          {["all", "image", "video"].map((f) => (
            <button
              key={f}
              className={filter === f ? "selected" : ""}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
            >
              {f === "all"
                ? "All media"
                : f === "image"
                  ? "Photographs"
                  : "Videos"}
            </button>
          ))}
        </div>
        <div className="gallery-grid">
          {data.gallery
            .filter((m) => filter === "all" || m.kind === filter)
            .map((m) => (
              <MediaView key={m.id} asset={m} />
            ))}
        </div>
        {!data.gallery.some((m) => filter === "all" || m.kind === filter) && (
          <p className="empty">No published media in this category yet.</p>
        )}
      </section>
    </>
  );
}
function Leadership() {
  const { data } = useData();
  const c = data.company;
  return (
    <>
      <PageHead
        eyebrow="LEADERSHIP"
        title={text(c.ceo_name) || "Company leadership"}
        description={text(c.ceo_position)}
      />
      <section className="section wrap split">
        <MediaView
          asset={
            typeof c.ceo_photo === "object" && c.ceo_photo
              ? c.ceo_photo
              : undefined
          }
          alt={text(c.ceo_name)}
        />
        <div className="prose">
          {c.ceo_bio && <p>{text(c.ceo_bio)}</p>}
          {c.ceo_message && (
            <>
              <h2>A message from our leadership</h2>
              <p>{text(c.ceo_message)}</p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
function PhoneRow({ p }: { p: Row }) {
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="phone-row">
      <a href={tel(p)}>
        {text(p.number)}
        {p.extension ? " ext. " + p.extension : ""}
      </a>
      <button
        className="icon-btn"
        aria-label={"Copy " + p.number}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text(p.number));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setErr("Select the displayed number to copy it.");
          }
        }}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
      <span className="sr-only" role="status">
        {copied ? "Number copied" : err}
      </span>
    </div>
  );
}
function Contact() {
  const { data } = useData();
  const c = data.company;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState(crypto.randomUUID());
  const services = data.content.filter((i) => i.kind === "service");
  return (
    <>
      <PageHead
        eyebrow="CONTACT / REQUEST A QUOTE"
        title="Let’s move your project forward."
        description="Tell us what you need. Send a project enquiry using the form below."
      />
      <section className="section wrap contact-layout">
        <div className="contact-info">
          <h2>Get in touch.</h2>
          {c.registration_number && (
            <p className="contact-registration">
              {text(c.official_name)}
              <br />
              <span>RC {text(c.registration_number)}</span>
            </p>
          )}
          {(c.phones || []).length > 0 && (
            <div className="info-group">
              <Phone />
              <div>
                <h3>Call our team</h3>
                {c.phones?.map((p, i) => (
                  <div key={i}>
                    <small>{text(p.label)}</small>
                    <PhoneRow p={p} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {(c.primary_email || (c.emails || []).length > 0) && (
            <div className="info-group">
              <Mail />
              <div>
                <h3>Email us</h3>
                {c.primary_email && (
                  <a href={"mailto:" + c.primary_email}>{c.primary_email}</a>
                )}
                {c.emails?.map((e, i) => (
                  <p key={i}>
                    <small>{text(e.label)}</small>
                    <a href={"mailto:" + e.email}>{text(e.email)}</a>
                  </p>
                ))}
              </div>
            </div>
          )}
          {c.offices?.map((o, i) => (
            <div key={i} className="info-group">
              <MapPin />
              <div>
                <h3>{text(o.label) || "Office"}</h3>
                <address>
                  {[o.address, o.city, o.region, o.postcode, o.country]
                    .filter(Boolean)
                    .join(", ")}
                </address>
                {o.map_url && (
                  <a href={text(o.map_url)} target="_blank" rel="noreferrer">
                    View map <ArrowUpRight size={14} />
                  </a>
                )}
                {o.directions_url && (
                  <a
                    href={text(o.directions_url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get directions <ArrowUpRight size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
          {c.whatsapp && (
            <a
              className="button secondary"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/${text(c.whatsapp).replace("+", "")}?text=${encodeURIComponent(text(c.whatsapp_message))}`}
            >
              Chat on WhatsApp <ArrowUpRight size={17} />
            </a>
          )}
          {(c.hours || []).length > 0 && (
            <div className="hours">
              <h3>Business hours</h3>
              {c.hours?.map((h, i) => (
                <p key={i}>
                  <span>{text(h.day)}</span>
                  <span>
                    {h.closed
                      ? "Closed"
                      : `${text(h.opens).slice(0, 5)} – ${text(h.closes).slice(0, 5)}`}
                  </span>
                </p>
              ))}
              {c.timezone && <small>{text(c.timezone)}</small>}
              {c.holiday_notice && <p>{text(c.holiday_notice)}</p>}
            </div>
          )}
          {c.additional?.map((d, i) => (
            <p key={i}>
              <strong>{text(d.label)}: </strong>
              {d.url ? (
                <a href={text(d.url)} target="_blank" rel="noreferrer">
                  {text(d.text) || text(d.url)}
                </a>
              ) : (
                text(d.text)
              )}
            </p>
          ))}
        </div>
        <form
          className="enquiry-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setMessage("");
            setError("");
            const form = e.currentTarget;
            const fd = new FormData(form);
            try {
              if(PUBLIC_PREVIEW){
                const service=services.find(s=>s.id===Number(fd.get('service')))?.title||'General enquiry';
                const body=`Name: ${fd.get('name')}\nEmail: ${fd.get('email')}\nTelephone: ${fd.get('telephone')||'Not supplied'}\nService: ${service}\n\n${fd.get('message')}`;
                window.location.href=`mailto:${c.primary_email}?subject=${encodeURIComponent(String(fd.get('subject')))}&body=${encodeURIComponent(body)}`;
                setMessage('Your email draft is ready to open. Send it from your email app to contact our team. No message has been sent automatically.');
                return;
              }
              const payload = {
                ...Object.fromEntries(fd),
                token,
                service: fd.get("service") ? Number(fd.get("service")) : null,
              };
              const r = await api("enquire/", "POST", payload);
              setMessage(r.detail);
              form.reset();
              setToken(crypto.randomUUID());
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <span className="eyebrow">SEND AN ENQUIRY</span>
          <h2>Tell us about your requirements.</h2>
          {PUBLIC_PREVIEW&&<p className="muted">This form opens your email app. Send the message there to contact our team.</p>}
          <div className="form-grid">
            <label>
              Your name *
              <input name="name" required maxLength={200} autoComplete="name" />
            </label>
            <label>
              Email address *
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <label>
              Telephone number
              <input
                name="telephone"
                type="tel"
                placeholder="+234…"
                autoComplete="tel"
              />
              <small>Optional. Include your country code.</small>
            </label>
            <label>
              Service
              <select
                name="service"
                defaultValue={
                  new URLSearchParams(location.search).get("service") || ""
                }
              >
                <option value="">General enquiry</option>
                {services.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Subject *<input name="subject" required maxLength={200} />
          </label>
          <label>
            Your message *
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={10000}
              rows={6}
            />
          </label>
          <div className="honeypot" aria-hidden="true">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <p className="muted">
            Your details will be used to respond to this enquiry.{" "}
            <Link to="/privacy">Read our privacy information.</Link>
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="success" role="status">
              {message}
            </p>
          )}
          <button type="submit" disabled={busy}>
            {busy ? "Preparing…" : PUBLIC_PREVIEW?"Open email draft":"Send enquiry"}{" "}
            <ArrowUpRight size={18} />
          </button>
        </form>
      </section>
    </>
  );
}
function Privacy() {
  const c = useData().data.company;
  return (
    <>
      <PageHead eyebrow="PRIVACY" title="Your information." />
      <section className="section wrap prose">
        <p>
          {text(c.privacy_text) || (PUBLIC_PREVIEW ? "This public preview opens enquiry drafts in your email app. The preview does not save form entries in a website database or send them automatically. Send your draft through your email provider to contact ESTMAJO. The preview does not provide an owner sign-in session. The full application provides server-stored enquiries and protected owner access after the company server is activated." : 
            "When you submit an enquiry, we store your name, email address, optional telephone number and message so the company can review and respond. An email notification may be sent to the company’s configured recipient. Essential cookies secure the owner’s sign-in and protect forms against request forgery. Uploaded media and documents are delivered through ImageKit. Contact the company through the enquiry form for questions about your information.")}
        </p>
      </section>
    </>
  );
}
function NotFound() {
  return (
    <section className="section wrap not-found">
      <span className="eyebrow">404 / PAGE NOT FOUND</span>
      <h1>
        Let’s get you back
        <br />
        on the right path.
      </h1>
      <p>This page may have moved or is not available.</p>
      <Link className="button" to="/">
        Back to home <ArrowRight size={18} />
      </Link>
    </section>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
