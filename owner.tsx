import { useEffect, useState, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  LayoutDashboard,
  Building2,
  BriefcaseBusiness,
  Images,
  UserRound,
  FileText,
  Inbox,
  Shield,
  LogOut,
  Plus,
  Trash2,
  Eye,
  Save,
  ChevronUp,
  ChevronDown,
  X,
  RefreshCw,
  LockKeyhole,
  EyeOff,
  Menu,
} from "lucide-react";
import { api, initAuth, upload, PUBLIC_PREVIEW, Company, Row, Asset, Item, Doc } from "./api";
import { useData, text, MediaView, BrandLoading } from "./shared";
type SetSettings = { data: Company; enquiry_recipient: string };
function useDirty(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const click = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (
        target &&
        target.getAttribute("href") &&
        !target.getAttribute("href")?.startsWith("#") &&
        !confirm("You have unsaved changes. Leave without saving?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
}
const sections = [
  ["Overview", LayoutDashboard],
  ["Company Information & Contact Settings", Building2],
  ["Services", BriefcaseBusiness],
  ["Projects", BriefcaseBusiness],
  ["Media library", Images],
  ["CEO / Leadership", UserRound],
  ["Company documents", FileText],
  ["Enquiries", Inbox],
  ["Account settings", Shield],
] as const;
type LoginProps = {
  company: Company;
  connected: boolean;
  checking: boolean;
  error: string;
  onRetry: () => void;
  onLogin: (credentials: { username: string; password: string }) => Promise<void>;
};
function OwnerLogin({ company, connected, checking, error, onRetry, onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const logo = typeof company.logo === "object" && company.logo ? company.logo.url : "/brand/estmajo-logo.jpg";
  return <main className="login-page">
    <section className="login-art" aria-label="Company administration">
      <Link className="login-logo" to="/" aria-label="ESTMAJO website"><img src={logo} alt="ESTMAJO Engineering Solutions Ltd" width="112" height="112" /></Link>
      <span className="eyebrow">ESTMAJO · OWNER WORKSPACE</span>
      <h1>Your company.<br />Always up to date.</h1>
      <p>A dedicated workspace for your company information, services, projects and customer enquiries.</p>
      <div className="login-features"><span><Building2 size={17} /> Company & contact details</span><span><Images size={17} /> Projects & media</span><span><Inbox size={17} /> Enquiries & notifications</span></div>
      <Link to="/">← Back to website</Link>
    </section>
    <div className="login-form">
      <span className="login-lock"><LockKeyhole size={24} /></span>
      <span className="eyebrow">ADMINISTRATION</span>
      <h2>Welcome back.</h2>
      <p className="muted">Sign in to manage {text(company.official_name) || "your company website"}.</p>
      <div className={"login-connection " + (connected ? "ready" : "pending")} role="status">
        <span className="connection-dot" />
        {checking ? "Connecting securely…" : connected ? "Company server connected" : PUBLIC_PREVIEW ? "Backend activation required" : "Company server unavailable"}
      </div>
      {checking && <BrandLoading compact />}
      {busy && <BrandLoading compact label="LOADING…" />}
      {!connected && !checking && <div className="login-notice"><p>{PUBLIC_PREVIEW ? "The login page is ready. Signing in becomes available once the Django backend and database are connected to this Netlify site." : "We could not establish a secure session. Check your connection and try again."}</p>{!PUBLIC_PREVIEW && <button type="button" className="secondary" onClick={onRetry}><RefreshCw size={16} /> Try connection again</button>}</div>}
      <form onSubmit={async e => {
        e.preventDefault();
        if (!connected || busy) return;
        const form = e.currentTarget;
        const fields = new FormData(form);
        setBusy(true);
        try { await onLogin({username: String(fields.get("username") || ""), password: String(fields.get("password") || "")}); }
        finally { const password = form.elements.namedItem("password") as HTMLInputElement | null; if (password) password.value = ""; setBusy(false); }
      }} aria-busy={busy}>
        <fieldset disabled={!connected || checking || busy}>
          <label htmlFor="owner-username">Username<input id="owner-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={150} required /></label>
          <label htmlFor="owner-password">Password</label>
          <div className="password-input"><input id="owner-password" type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" maxLength={1024} required /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          {error && <p role="alert" className="error">{error}</p>}
          <button className="login-submit" type="submit">{busy ? "Signing in…" : "Sign in securely"}<ArrowUpRight size={18} /></button>
        </fieldset>
      </form>
      <button type="button" className="login-recovery" onClick={() => setRecovery(v => !v)} aria-expanded={recovery} aria-controls="owner-recovery">Need help signing in?</button>
      {recovery && <div id="owner-recovery" className="login-notice"><p>Use the administrator account created during server setup. There is no default password or public registration.</p><p>If you have forgotten your password, ask your authorised server administrator to verify your identity and reset it with Django’s interactive <code>changepassword</code> command.</p></div>}
      <p className="login-security"><Shield size={15} /> Authorised administrators only. Protected by secure sessions and CSRF validation when connected.</p>
    </div>
  </main>;
}
export function Dashboard() {
  const { data: siteData } = useData();
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [section, setSection] = useState("Overview");
  const [nav, setNav] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const navigate = useNavigate();
  const connect = async () => {
    setLoading(true); setError("");
    try {
      const d = await initAuth();
      setConnected(!PUBLIC_PREVIEW);
      setUser(d.authenticated ? d.username : null);
    } catch (e) { setConnected(false); setError((e as Error).message); }
    finally { setLoading(false); }
  };
  useEffect(() => { void connect(); }, []);
  const change = (s: string) => {
    if (
      dirty &&
      !confirm("You have unsaved edits. Discard them and switch sections?")
    )
      return;
    setDirty(false);
    setSection(s);
    setNav(false);
  };
  if (!user) return <OwnerLogin company={siteData.company} connected={connected} checking={loading} error={error} onRetry={() => void connect()} onLogin={async credentials => {
    setError("");
    try {
      const d = await api("auth/", "POST", credentials);
      setUser(d.username);
    } catch (err) { setError((err as Error).message); }
  }} />;
  return (
    <div className="dashboard">
      <aside className={"sidebar " + (nav ? "show" : "")}>
        <Link className="owner-brand" to="/">
          {typeof siteData.company.logo === "object" &&
          siteData.company.logo ? (
            <img
              src={siteData.company.logo.url}
              width="48"
              height="48"
              alt=""
            />
          ) : (
            "E"
          )}
          <span>
            {text(siteData.company.official_name).replace(
              /\s+Engineering Solutions\s+(Limited|Ltd)$/i,
              "",
            ) || "COMPANY"}
            <small>OWNER WORKSPACE</small>
          </span>
        </Link>
        <nav aria-label="Dashboard">
          {sections.map(([name, Icon]) => (
            <button
              className={section === name ? "selected" : ""}
              key={name}
              onClick={() => change(name)}
            >
              <Icon size={18} />
              {name}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/" target="_blank">
            View website <ArrowUpRight size={16} />
          </Link>
          <button
            onClick={async () => {
              if (dirty && !confirm("Discard unsaved changes and sign out?"))
                return;
              try {
                await api("auth/", "DELETE");
                setUser(null);
                setDirty(false);
                navigate("/owner");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <div className="owner-main">
        <div className="owner-top">
          <button
            className="icon-btn mobile-only"
            onClick={() => setNav(!nav)}
            aria-label="Toggle dashboard navigation"
          >
            <Menu />
          </button>
          <span>
            Administration <span className="muted">/ {section}</span>
          </span>
          <span className="user-badge">
            <UserRound size={16} />
            {user}
          </span>
        </div>
        <div className="owner-content">
          <div className="owner-heading">
            <div>
              <span className="eyebrow">YOUR WEBSITE, YOUR CONTROL</span>
              <h1>{section}</h1>
            </div>
            {dirty && <span className="badge amber">Unsaved changes</span>}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div key={section}>
            {section === "Overview" ? (
              <Overview onChange={change} />
            ) : section === "Company Information & Contact Settings" ||
              section === "CEO / Leadership" ? (
              <SettingsEditor
                leadership={section === "CEO / Leadership"}
                onDirty={setDirty}
              />
            ) : section === "Services" || section === "Projects" ? (
              <ContentManager
                kind={section === "Services" ? "service" : "project"}
                onDirty={setDirty}
              />
            ) : section === "Media library" ? (
              <MediaManager onDirty={setDirty} />
            ) : section === "Company documents" ? (
              <Documents onDirty={setDirty} />
            ) : section === "Enquiries" ? (
              <Enquiries />
            ) : (
              <Account />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function useLoad<T>(path: string) {
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState("");
  const refresh = () =>
    api(path)
      .then(setValue)
      .catch((e) => setError(e.message));
  useEffect(() => {
    refresh();
  }, [path]);
  return { value, error, refresh };
}
function Notice({ error, message }: { error?: string; message?: string }) {
  if (error && error.toLowerCase().startsWith("loading")) return <BrandLoading compact />;
  return (
    <>
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
    </>
  );
}
function Overview({ onChange }: { onChange: (s: string) => void }) {
  const { value: v, error } =
    useLoad<Record<string, number | boolean>>("owner/overview/");
  if (!v) return <Notice error={error || "Loading overview…"} />;
  return (
    <>
      <div className="overview-banner">
        <div>
          <span className="eyebrow">WELCOME TO YOUR WORKSPACE</span>
          <h2>
            Keep your business
            <br />
            in the picture.
          </h2>
          <p>
            Add company details, publish your work and respond to enquiries.
          </p>
          <button
            onClick={() => onChange("Company Information & Contact Settings")}
          >
            Manage company information <ArrowUpRight size={17} />
          </button>
        </div>
        <Building2 size={130} strokeWidth={0.7} />
      </div>
      <div className="stat-grid">
        {[
          ["Services", v.services],
          ["Projects", v.projects],
          ["Enquiries", v.enquiries],
          ["Unread enquiries", v.unread],
        ].map(([n, c]) => (
          <button
            key={String(n)}
            className="stat"
            onClick={() =>
              onChange(n === "Unread enquiries" ? "Enquiries" : String(n))
            }
          >
            <span>{n}</span>
            <strong>{c}</strong>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </div>
      <div className="panel">
        <h2>Launch & integration status</h2>
        <p>
          <span
            className={"dot " + (v.imagekit_configured ? "green" : "orange")}
          />
          ImageKit:{" "}
          {v.imagekit_configured
            ? "Credentials configured; verify a live upload."
            : "Server configuration required."}
        </p>
        <p>
          <span
            className={"dot " + (v.email_configured ? "green" : "orange")}
          />
          Email:{" "}
          {v.email_configured
            ? "Configured; verify a live test enquiry."
            : "SMTP settings, authenticated sender and enquiry recipient required."}
        </p>
        <p>
          {String(v.notification_issues)} notification issue(s) need review.
        </p>
        <p className="muted">
          Official branding: ESTMAJO ENGINEERING SOLUTIONS LTD, RC 7810123. The
          supplied logo, Warri office, email and two confirmed telephone numbers are included.
        </p>
      </div>
    </>
  );
}
type Field = { key: string; label: string; type?: string; hint?: string };
const groups: { title: string; hint?: string; fields: Field[] }[] = [
  {
    title: "Company identity",
    fields: [
      {
        key: "official_name",
        label: "Official company name",
        hint: "Confirmed name: ESTMAJO ENGINEERING SOLUTIONS LTD.",
      },
      { key: "trading_name", label: "Trading name" },
      { key: "tagline", label: "Tagline" },
      { key: "registration_number", label: "Registration number" },
      { key: "logo", label: "Original company logo", type: "asset" },
      { key: "favicon", label: "Favicon", type: "asset" },
      {
        key: "use_supplied_logo",
        label: "Use original supplied logo when no replacement is selected",
        type: "checkbox",
      },
    ],
  },
  {
    title: "Company profile",
    fields: [
      { key: "short_intro", label: "Short introduction", type: "textarea" },
      {
        key: "description",
        label: "Full company description",
        type: "textarea",
      },
      { key: "mission", label: "Mission", type: "textarea" },
      { key: "vision", label: "Vision", type: "textarea" },
      { key: "values", label: "Values", type: "textarea" },
      { key: "year_established", label: "Year established", type: "number" },
    ],
  },
  {
    title: "Email addresses",
    hint: "The enquiry recipient is private and is never shown on the public website.",
    fields: [
      { key: "primary_email", label: "Primary public email", type: "email" },
      {
        key: "enquiry_recipient",
        label: "Private enquiry recipient",
        type: "email",
      },
    ],
  },
  {
    title: "WhatsApp",
    fields: [
      {
        key: "whatsapp",
        label: "Business number",
        type: "tel",
        hint: "International format, starting with + and country code.",
      },
      {
        key: "whatsapp_message",
        label: "Introductory message",
        type: "textarea",
      },
    ],
  },
  {
    title: "Business hours",
    fields: [
      {
        key: "timezone",
        label: "Timezone",
        hint: "IANA timezone, such as Africa/Lagos. Leave empty if unknown.",
      },
      { key: "holiday_notice", label: "Holiday notice", type: "textarea" },
    ],
  },
  {
    title: "Leadership",
    fields: [
      { key: "ceo_name", label: "CEO name" },
      { key: "ceo_position", label: "Position" },
      { key: "ceo_photo", label: "Photograph", type: "asset" },
      { key: "ceo_bio", label: "Biography", type: "textarea" },
      { key: "ceo_message", label: "Leadership message", type: "textarea" },
    ],
  },
  {
    title: "Footer information",
    fields: [
      {
        key: "footer_description",
        label: "Short footer description",
        type: "textarea",
      },
      { key: "copyright_owner", label: "Copyright owner" },
    ],
  },
  {
    title: "Search and sharing information",
    fields: [
      { key: "seo_title", label: "Default page title" },
      {
        key: "seo_description",
        label: "Default description",
        type: "textarea",
      },
      { key: "sharing_image", label: "Sharing image", type: "asset" },
    ],
  },
  {
    title: "Privacy information",
    fields: [
      {
        key: "privacy_text",
        label: "Privacy information",
        type: "textarea",
        hint: "Add your approved retention period, data contact and other applicable privacy information.",
      },
    ],
  },
];
const rowGroups: { key: string; title: string; fields: Field[] }[] = [
  {
    key: "emails",
    title: "Additional email addresses",
    fields: [{ key: "email", label: "Email address", type: "email" }],
  },
  {
    key: "phones",
    title: "Telephone numbers",
    fields: [
      { key: "number", label: "Number with country code", type: "tel" },
      { key: "extension", label: "Extension" },
      { key: "primary", label: "Primary telephone number", type: "checkbox" },
    ],
  },
  {
    key: "offices",
    title: "Office addresses",
    fields: [
      { key: "address", label: "Street address", type: "textarea" },
      { key: "city", label: "City" },
      { key: "region", label: "State / region" },
      { key: "postcode", label: "Postcode" },
      { key: "country", label: "Country" },
      { key: "map_url", label: "Map location link", type: "url" },
      { key: "directions_url", label: "Directions link", type: "url" },
    ],
  },
  {
    key: "socials",
    title: "Online presence",
    fields: [
      { key: "url", label: "Social profile URL", type: "url" },
      {
        key: "verified",
        label: "I have verified that this is an official company profile",
        type: "checkbox",
      },
    ],
  },
  {
    key: "additional",
    title: "Additional Company Details",
    fields: [
      { key: "text", label: "Text", type: "textarea" },
      { key: "url", label: "Optional validated link", type: "url" },
    ],
  },
];
function FieldInput({
  field,
  value,
  onChange,
  assets = [],
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  assets?: Asset[];
}) {
  return (
    <label className={field.type === "checkbox" ? "checkbox-label" : ""}>
      {field.type === "checkbox" ? (
        <>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          {field.label}
        </>
      ) : (
        <>
          {field.label}
          {field.type === "textarea" ? (
            <textarea
              rows={4}
              value={text(value)}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : field.type === "asset" ? (
            <select
              value={typeof value === "number" ? value : ""}
              onChange={(e) =>
                onChange(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">No replacement selected</option>
              {assets
                .filter((a) => a.kind === "image")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          ) : (
            <input
              type={field.type || "text"}
              value={typeof value === "number" ? value : text(value)}
              onChange={(e) =>
                onChange(
                  field.type === "number"
                    ? e.target.value
                      ? Number(e.target.value)
                      : null
                    : e.target.value,
                )
              }
            />
          )}
        </>
      )}
      {field.hint && <small>{field.hint}</small>}
    </label>
  );
}
function RepeatRows({
  rows,
  onChange,
  title,
  fields,
}: {
  rows: Row[];
  onChange: (r: Row[]) => void;
  title: string;
  fields: Field[];
}) {
  const update = (i: number, k: string, v: unknown) =>
    onChange(
      rows.map((r, j) => (j === i ? { ...r, [k]: v as Row[string] } : r)),
    );
  const move = (i: number, delta: number) => {
    const n = [...rows];
    [n[i], n[i + delta]] = [n[i + delta], n[i]];
    onChange(n.map((r, j) => ({ ...r, order: j })));
  };
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        <button
          type="button"
          className="secondary small"
          onClick={() =>
            onChange([
              ...rows,
              {
                label: "",
                visible: true,
                order: rows.length,
                ...Object.fromEntries(
                  fields.map((f) => [
                    f.key,
                    f.type === "checkbox" ? false : "",
                  ]),
                ),
              },
            ])
          }
        >
          <Plus size={16} /> Add entry
        </button>
      </div>
      {!rows.length && (
        <p className="muted">
          No entries yet. Add only confirmed company details.
        </p>
      )}
      {rows.map((r, i) => (
        <div className="repeat-row" key={i}>
          <div className="row-tools">
            <strong>Entry {i + 1}</strong>
            <button
              type="button"
              className="icon-btn"
              aria-label="Move entry up"
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Move entry down"
              disabled={i === rows.length - 1}
              onClick={() => move(i, 1)}
            >
              <ChevronDown size={16} />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              aria-label="Remove entry"
              onClick={() => {
                if (confirm("Remove this entry? Save changes to apply."))
                  onChange(
                    rows
                      .filter((_, j) => j !== i)
                      .map((v, j) => ({ ...v, order: j })),
                  );
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="form-grid">
            <FieldInput
              field={{ key: "label", label: "Display label" }}
              value={r.label}
              onChange={(v) => update(i, "label", v)}
            />
            {fields.map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={r[f.key]}
                onChange={(v) => {
                  if (f.key === "primary" && v) {
                    onChange(
                      rows.map((row, j) => ({ ...row, primary: j === i })),
                    );
                  } else update(i, f.key, v);
                }}
              />
            ))}
            <FieldInput
              field={{
                key: "visible",
                label: "Show publicly",
                type: "checkbox",
              }}
              value={r.visible}
              onChange={(v) => update(i, "visible", v)}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
function SettingsEditor({
  leadership,
  onDirty,
}: {
  leadership: boolean;
  onDirty: (d: boolean) => void;
}) {
  const { value, error: loadError } = useLoad<SetSettings>("owner/settings/");
  const { value: assets } = useLoad<Asset[]>("owner/media/");
  const [form, setForm] = useState<SetSettings | null>(null);
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const { refresh } = useData();
  useEffect(() => {
    if (value) {
      setForm(value);
      setSaved(JSON.stringify(value));
    }
  }, [value]);
  const dirty = !!form && JSON.stringify(form) !== saved;
  useDirty(dirty);
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  if (!form) return <Notice error={loadError || "Loading settings…"} />;
  const change = (k: string, v: unknown) =>
    setForm(
      k === "enquiry_recipient"
        ? { ...form, enquiry_recipient: String(v) }
        : { ...form, data: { ...form.data, [k]: v } },
    );
  const cancel = () => {
    if (!dirty || confirm("Discard all unsaved edits?")) {
      setForm(JSON.parse(saved));
      setError("");
      setMessage("Unsaved changes cancelled.");
    }
  };
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setMessage("");
        try {
          const r = await api("owner/settings/", "PUT", form);
          setForm(r);
          setSaved(JSON.stringify(r));
          setMessage(
            "Changes saved. The website now uses your latest company details.",
          );
          await refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="muted">
        All fields are optional. Unknown details can stay empty. Images are
        selected from your media library.
      </p>
      <Notice error={error} message={message} />
      {groups
        .filter((g) => (leadership ? g.title === "Leadership" : true))
        .map((g) => (
          <section className="panel" key={g.title}>
            <h2>{g.title}</h2>
            {g.hint && <p className="muted">{g.hint}</p>}
            <div className="form-grid">
              {g.fields.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={
                    f.key === "enquiry_recipient"
                      ? form.enquiry_recipient
                      : form.data[f.key]
                  }
                  onChange={(v) => change(f.key, v)}
                  assets={assets || []}
                />
              ))}
            </div>
          </section>
        ))}
      {!leadership && (
        <>
          {rowGroups.map((g) => (
            <RepeatRows
              key={g.key}
              title={g.title}
              fields={g.fields}
              rows={(form.data[g.key] as Row[]) || []}
              onChange={(r) => change(g.key, r)}
            />
          ))}
          <section className="panel">
            <h2>Weekly opening hours</h2>
            <p className="muted">
              Add your schedule only when known. Closed days require no times.
            </p>
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => {
              const rows = form.data.hours || [];
              const row = rows.find((h) => h.day === day);
              const edit = (key: string, v: unknown) =>
                change(
                  "hours",
                  row
                    ? rows.map((h) => (h.day === day ? { ...h, [key]: v } : h))
                    : [
                        ...rows,
                        {
                          day,
                          closed: true,
                          opens: null,
                          closes: null,
                          [key]: v,
                        },
                      ],
                );
              return (
                <div className="hours-row" key={day}>
                  <strong>{day}</strong>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!row}
                      onChange={(e) =>
                        change(
                          "hours",
                          e.target.checked
                            ? [
                                ...rows,
                                {
                                  day,
                                  closed: true,
                                  opens: null,
                                  closes: null,
                                },
                              ]
                            : rows.filter((h) => h.day !== day),
                        )
                      }
                    />
                    Set hours
                  </label>
                  {row && (
                    <>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={!!row.closed}
                          onChange={(e) => edit("closed", e.target.checked)}
                        />
                        Closed
                      </label>
                      {!row.closed && (
                        <>
                          <label>
                            Opens
                            <input
                              type="time"
                              value={text(row.opens).slice(0, 5)}
                              onChange={(e) =>
                                edit("opens", e.target.value || null)
                              }
                            />
                          </label>
                          <label>
                            Closes
                            <input
                              type="time"
                              value={text(row.closes).slice(0, 5)}
                              onChange={(e) =>
                                edit("closes", e.target.value || null)
                              }
                            />
                          </label>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}
      <div className="savebar">
        <button type="submit" disabled={busy || !dirty}>
          <Save size={17} />
          {busy ? "Saving…" : "Save Changes"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setPreview(true)}
        >
          <Eye size={17} /> Preview
        </button>
        <button
          type="button"
          className="ghost"
          disabled={!dirty}
          onClick={cancel}
        >
          Cancel Unsaved Changes
        </button>
      </div>
      {preview && (
        <Modal
          title="Company information preview — unsaved"
          close={() => setPreview(false)}
        >
          <h2>{text(form.data.official_name)}</h2>
          <p>{text(form.data.tagline)}</p>
          {[
            "short_intro",
            "description",
            "mission",
            "vision",
            "values",
            "ceo_name",
            "ceo_position",
            "ceo_bio",
            "ceo_message",
            "footer_description",
          ].map((k) =>
            form.data[k] ? (
              <div className="preview-section" key={k}>
                <h3>{k.replaceAll("_", " ")}</h3>
                <p>{text(form.data[k])}</p>
              </div>
            ) : null,
          )}
          {form.data.primary_email && <p>{form.data.primary_email}</p>}
          {rowGroups.map((g) => (
            <div key={g.key}>
              {((form.data[g.key] as Row[]) || [])
                .filter((r) => r.visible && (g.key !== "socials" || r.verified))
                .map((r, i) => (
                  <p key={i}>
                    <strong>{text(r.label)}</strong>{" "}
                    {Object.entries(r)
                      .filter(
                        ([k]) =>
                          ![
                            "label",
                            "order",
                            "visible",
                            "primary",
                            "verified",
                          ].includes(k),
                      )
                      .map(([, v]) => String(v || ""))
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                ))}
            </div>
          ))}
          {["logo", "ceo_photo", "sharing_image"].map((k) => (
            <MediaView
              key={k}
              asset={assets?.find((a) => a.id === form.data[k])}
            />
          ))}
          <p className="muted">
            The private enquiry recipient is excluded from this public preview.
          </p>
        </Modal>
      )}
    </form>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const active = document.activeElement as HTMLElement;
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const els = [
          ...document.querySelectorAll<HTMLElement>(
            ".modal button,.modal a,.modal input,.modal select,.modal textarea",
          ),
        ].filter((x) => !(x as HTMLButtonElement).disabled);
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", escape);
    document.querySelector<HTMLButtonElement>(".modal button")?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", escape);
      document.body.style.overflow = old;
      active?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
      >
        <div className="panel-heading">
          <h2>{title}</h2>
          <button
            className="icon-btn"
            type="button"
            onClick={close}
            aria-label="Close preview"
          >
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function ContentManager({
  kind,
  onDirty,
}: {
  kind: "service" | "project";
  onDirty: (d: boolean) => void;
}) {
  const {
    value: items,
    refresh,
    error: loadError,
  } = useLoad<Item[]>("owner/content/");
  const { value: assets } = useLoad<Asset[]>("owner/media/");
  const [item, setItem] = useState<Item | null>(null);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const { refresh: publicRefresh } = useData();
  const dirty = !!item && JSON.stringify(item) !== saved;
  useDirty(dirty);
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  const edit = (v: Item) => {
    setItem(structuredClone(v));
    setSaved(JSON.stringify(v));
    setError("");
  };
  const done = () => {
    if (dirty && !confirm("Discard your unsaved edits?")) return;
    setItem(null);
    setError("");
  };
  const change = (k: string, v: unknown) =>
    setItem(item ? { ...item, [k]: v } : null);
  if (!items) return <Notice error={loadError || "Loading content…"} />;
  return (
    <>
      <Notice error={error} />
      {item ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const payload = {
                ...item,
                attachments: item.attachments.map((a) => ({
                  media: a.media || a.asset?.id,
                  alt: a.alt,
                  caption: a.caption,
                  cover: a.cover,
                  order: a.order || 0,
                })),
              };
              const r = await api(
                "owner/content/" + (item.id ? item.id + "/" : ""),
                item.id ? "PUT" : "POST",
                payload,
              );
              setItem(r);
              setSaved(JSON.stringify(r));
              await refresh();
              await publicRefresh();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <button type="button" className="ghost" onClick={done}>
            <ArrowLeft size={16} /> Back to {kind}s
          </button>
          <div className="panel">
            <div className="form-grid">
              {[
                { key: "title", label: "Title" },
                {
                  key: "slug",
                  label: "URL slug",
                  hint: "Use lowercase letters, numbers and hyphens.",
                },
                { key: "summary", label: "Short summary", type: "textarea" },
                { key: "body", label: "Full description", type: "textarea" },
                { key: "order", label: "Display order", type: "number" },
                {
                  key: "published",
                  label: "Published on the website",
                  type: "checkbox",
                },
              ].map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={item[f.key as keyof Item]}
                  onChange={(v) => change(f.key, v)}
                />
              ))}
            </div>
          </div>
          <div className="panel">
            <h2>Photographs & videos</h2>
            <p className="muted">
              Upload files in the media library first, then attach them here.
              Images can be selected as the cover.
            </p>
            <label>
              Add media
              <select
                value=""
                onChange={(e) => {
                  const asset = assets?.find(
                    (a) => a.id === Number(e.target.value),
                  );
                  if (asset)
                    change("attachments", [
                      ...item.attachments,
                      {
                        media: asset.id,
                        asset,
                        alt: asset.alt,
                        caption: asset.caption,
                        cover: false,
                        order: item.attachments.length,
                      },
                    ]);
                }}
              >
                <option value="">Select an uploaded file</option>
                {assets
                  ?.filter(
                    (a) =>
                      a.kind !== "document" &&
                      !item.attachments.some(
                        (r) => (r.media || r.asset?.id) === a.id,
                      ),
                  )
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </label>
            {item.attachments.map((a, i) => (
              <div className="attachment-row" key={a.media || a.asset?.id}>
                <MediaView
                  asset={a.asset || assets?.find((m) => m.id === a.media)}
                />
                <div className="form-grid">
                  {[
                    {
                      key: "alt",
                      label: "Alternative text / video description",
                    },
                    { key: "caption", label: "Caption" },
                    { key: "order", label: "Display order", type: "number" },
                    {
                      key: "cover",
                      label: "Use as cover image",
                      type: "checkbox",
                    },
                  ].map((f) => (
                    <FieldInput
                      key={f.key}
                      field={f}
                      value={a[f.key as keyof typeof a]}
                      onChange={(v) =>
                        change(
                          "attachments",
                          item.attachments.map((r, j) =>
                            j === i
                              ? { ...r, [f.key]: v }
                              : f.key === "cover" && v
                                ? { ...r, cover: false }
                                : r,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="ghost danger"
                  onClick={() =>
                    change(
                      "attachments",
                      item.attachments.filter((_, j) => i !== j),
                    )
                  }
                >
                  Remove attachment
                </button>
              </div>
            ))}
          </div>
          <div className="savebar">
            <button disabled={busy || !dirty}>
              <Save size={16} />
              {busy ? "Saving…" : "Save " + kind}
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => setPreview(true)}
            >
              <Eye size={16} /> Preview
            </button>
            <button
              className="ghost"
              type="button"
              onClick={() => {
                setItem(JSON.parse(saved));
                setError("");
              }}
              disabled={!dirty}
            >
              Cancel Unsaved Changes
            </button>
          </div>
          {preview && (
            <Modal
              title="Content preview — unsaved"
              close={() => setPreview(false)}
            >
              <span className="badge">
                {item.published ? "Will be published on save" : "Private draft"}
              </span>
              <h1>{item.title}</h1>
              <p>{item.summary}</p>
              <p className="prose">{item.body}</p>
              {[...item.attachments]
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((a, i) => (
                  <MediaView
                    key={i}
                    asset={a.asset}
                    alt={a.alt}
                    caption={a.caption}
                  />
                ))}
            </Modal>
          )}
        </form>
      ) : (
        <>
          <div className="list-toolbar">
            <p className="muted">
              Drafts are private. Publish only approved company information.
            </p>
            <button
              onClick={() => {
                const v: Item = {
                  kind,
                  title: "",
                  slug: "",
                  summary: "",
                  body: "",
                  published: false,
                  order: items.filter((i) => i.kind === kind).length,
                  attachments: [],
                };
                edit(v);
                setSaved("");
              }}
            >
              <Plus size={16} /> Add {kind}
            </button>
          </div>
          <div className="panel content-list">
            {items
              .filter((i) => i.kind === kind)
              .map((v, i, all) => (
                <article key={v.id}>
                  <span className="list-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{v.title}</h3>
                    <span className={"badge " + (v.published ? "green" : "")}>
                      {v.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="row-tools">
                    <button
                      className="icon-btn"
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={async () => {
                        try {
                          await api(`owner/content/${v.id}/`, "PATCH", {
                            order: all[i - 1].order - 1,
                          });
                          await refresh();
                          await publicRefresh();
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      <ChevronUp size={17} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Move down"
                      disabled={i === all.length - 1}
                      onClick={async () => {
                        try {
                          await api(`owner/content/${v.id}/`, "PATCH", {
                            order: all[i + 1].order + 1,
                          });
                          await refresh();
                          await publicRefresh();
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      <ChevronDown size={17} />
                    </button>
                    <button className="secondary small" onClick={() => edit(v)}>
                      Edit
                    </button>
                    <button
                      className="icon-btn danger"
                      aria-label={"Delete " + v.title}
                      onClick={async () => {
                        if (!confirm("Permanently delete “" + v.title + "”?"))
                          return;
                        try {
                          await api(`owner/content/${v.id}/`, "DELETE");
                          await refresh();
                          await publicRefresh();
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            {!items.some((v) => v.kind === kind) && (
              <p className="empty">No {kind}s yet. Create your first one.</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
function MediaManager({ onDirty }: { onDirty: (d: boolean) => void }) {
  const {
    value: assets,
    refresh,
    error: loadError,
  } = useLoad<Asset[]>("owner/media/");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [localMedia, setLocalMedia] = useState<{url:string;kind:"image"|"video";name:string}|null>(null);
  const [latestSaved, setLatestSaved] = useState<Asset|null>(null);
  const [viewing, setViewing] = useState<Asset|null>(null);
  useEffect(() => () => { if (localMedia?.url) URL.revokeObjectURL(localMedia.url); }, [localMedia]);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Asset | null>(null);
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh: publicRefresh } = useData();
  const dirty = !!editing && JSON.stringify(editing) !== saved;
  useDirty(dirty);
  useEffect(() => {
    onDirty(dirty || progress !== null);
  }, [dirty, progress, onDirty]);
  return (
    <>
      <Notice error={error || loadError} />
      <div className="panel upload-box">
        <Images size={30} />
        <h2>Your media library</h2>
        <p>
          JPEG, PNG, WebP, MP4, WebM and PDF. Uploads stay private until
          attached to published content or selected for public display.
        </p>
        <label className="file-picker">
          Upload file
          <input
            disabled={progress !== null}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.pdf"
            onChange={async (e) => {
              const input = e.currentTarget;
              const file = input.files?.[0];
              if (!file) return;
              setLocalMedia(file.type.startsWith("image/") || file.type.startsWith("video/") ? {url:URL.createObjectURL(file), kind:file.type.startsWith("video/") ? "video" : "image", name:file.name} : null);
              setLatestSaved(null);
              setProgress(0);
              setError("");
              try {
                const uploaded = await upload(file, setProgress);
                setLatestSaved(uploaded);
                await refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setProgress(null);
                input.value = "";
              }
            }}
          />
        </label>
        {progress !== null && <BrandLoading compact label="LOADING…" />}
        {progress !== null && (
          <div role="status">
            <progress max={100} value={progress} />
            <p>
              {progress === 100
                ? "Upload transferred. Verifying asset metadata…"
                : `Uploading ${progress}%`}
            </p>
          </div>
        )}
        {localMedia && !latestSaved && <div className="upload-viewer"><h3>Selected from your gallery: {localMedia.name}</h3>{localMedia.kind === "video" ? <video src={localMedia.url} controls playsInline preload="metadata" /> : <img src={localMedia.url} alt={localMedia.name} />}<p>{progress !== null ? "Uploading to your private media library…" : "Local selection only. If upload failed, this file is not saved on the server."}</p></div>}
        {latestSaved && <div className="upload-viewer" role="status"><h3>Uploaded successfully — view or play now</h3><MediaView asset={latestSaved} /><p>Private until you choose Publish to gallery below.</p></div>}
      </div>
      <div className="tabs">
        {["all", "image", "video", "document", "unused"].map((f) => (
          <button
            key={f}
            className={f === filter ? "selected" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="media-grid">
        {assets
          ?.filter(
            (a) =>
              filter === "all" ||
              a.kind === filter ||
              (filter === "unused" &&
                !a.gallery &&
                !Object.values(a.references || {}).some((v) => v.length)),
          )
          .map((a) => (
            <article className="media-card" key={a.id}>
              <MediaView asset={a} />
              <h3>{a.name}</h3>
              <p className="muted">
                {a.kind} {a.gallery ? "• In public gallery" : ""}
              </p>
              <div className="row-tools">
                {a.kind !== "document" && <button type="button" className="secondary small" disabled={busy} onClick={async () => {
                  setBusy(true); setError("");
                  try { setViewing(await api(`owner/media/${a.id}/playback/`)); }
                  catch(e) { setError((e as Error).message); }
                  finally { setBusy(false); }
                }}><Eye size={16} /> {a.kind === "video" ? "Play video" : "View image"}</button>}
                {a.kind !== "document" && <button type="button" className="secondary small" onClick={async () => {
                  if (!a.gallery && !confirm("Publish this file to the public gallery?")) return;
                  setError(""); setBusy(true);
                  try { await api(`owner/media/${a.id}/`, "PATCH", {gallery:!a.gallery}); await refresh(); await publicRefresh(); }
                  catch(e) { setError((e as Error).message); }
                  finally { setBusy(false); }
                }} disabled={busy}>{a.gallery ? "Unpublish" : "Publish to gallery"}</button>}
                <button
                  className="secondary small"
                  onClick={() => {
                    if (dirty && !confirm("Discard unsaved edits?")) return;
                    setEditing(structuredClone(a));
                    setSaved(JSON.stringify(a));
                  }}
                >
                  Edit details
                </button>
                <button
                  className="icon-btn danger"
                  aria-label={"Delete " + a.name}
                  onClick={async () => {
                    if (
                      !confirm(
                        "Permanently delete this asset from ImageKit? Shared assets cannot be deleted while in use.",
                      )
                    )
                      return;
                    try {
                      await api(`owner/media/${a.id}/`, "DELETE");
                      await refresh();
                      await publicRefresh();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
      </div>
      {viewing && <Modal title={viewing.kind === "video" ? "Play uploaded video" : "View uploaded image"} close={() => setViewing(null)}><div className="full-media-view"><MediaView asset={viewing} /></div><button type="button" className="secondary small" disabled={busy} onClick={async () => {
        if (!viewing) return;
        setBusy(true); setError("");
        try { setViewing(await api(`owner/media/${viewing.id}/playback/`)); }
        catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
      }}>Refresh secure media link</button></Modal>}
      {editing && (
        <Modal
          title="Media details"
          close={() => {
            if (!dirty || confirm("Discard unsaved edits?")) setEditing(null);
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await api(`owner/media/${editing.id}/`, "PATCH", {
                  alt: editing.alt,
                  caption: editing.caption,
                  gallery: editing.gallery,
                  order: editing.order,
                });
                setEditing(null);
                await refresh();
                await publicRefresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Notice error={error} />
            <MediaView asset={editing} />
            {[
              { key: "alt", label: "Alternative text / video description" },
              { key: "caption", label: "Caption", type: "textarea" },
              { key: "order", label: "Display order", type: "number" },
              ...(editing.kind !== "document"
                ? [
                    {
                      key: "gallery",
                      label: "Show in public gallery",
                      type: "checkbox",
                    },
                  ]
                : []),
            ].map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={editing[f.key as keyof Asset]}
                onChange={(v) => setEditing({ ...editing, [f.key]: v })}
              />
            ))}
            <p className="muted">
              References: {JSON.stringify(editing.references)}. To replace a
              file, upload its replacement, update these references, then delete
              the unused original.
            </p>
            <button disabled={busy || !dirty}>Save media details</button>
          </form>
        </Modal>
      )}
    </>
  );
}
function Documents({ onDirty }: { onDirty: (d: boolean) => void }) {
  const {
    value: docs,
    refresh,
    error: loadError,
  } = useLoad<Doc[]>("owner/documents/");
  const { value: assets } = useLoad<Asset[]>("owner/media/");
  const [doc, setDoc] = useState<Doc | null>(null);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh: publicRefresh } = useData();
  const dirty = !!doc && JSON.stringify(doc) !== saved;
  useDirty(dirty);
  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);
  return (
    <>
      <Notice error={error || loadError} />
      <p className="muted">
        Upload PDF documents in the media library, then select them here. Only
        approved public documents appear on the website.
      </p>
      <button
        onClick={() => {
          if (dirty && !confirm("Discard unsaved edits?")) return;
          setDoc({
            title: "",
            media: 0,
            public: false,
            profile: false,
            order: 0,
          });
          setSaved("");
        }}
      >
        <Plus size={17} /> Add company document
      </button>
      <div className="panel content-list">
        {docs?.map((d) => (
          <article key={d.id}>
            <FileText />
            <div>
              <h3>{d.title}</h3>
              <span className="badge">
                {d.public ? "Public" : "Private"}
                {d.profile ? " • Company profile" : ""}
              </span>
            </div>
            <button
              className="secondary small"
              onClick={() => {
                if (dirty && !confirm("Discard unsaved edits?")) return;
                setDoc(d);
                setSaved(JSON.stringify(d));
              }}
            >
              Edit
            </button>
            <button
              className="icon-btn danger"
              aria-label={"Delete " + d.title}
              onClick={async () => {
                if (
                  !confirm(
                    "Remove this document listing? The uploaded PDF will remain in the media library.",
                  )
                )
                  return;
                try {
                  await api(`owner/documents/${d.id}/`, "DELETE");
                  await refresh();
                  await publicRefresh();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <Trash2 size={17} />
            </button>
          </article>
        ))}
      </div>
      {doc && (
        <div className="panel">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await api(
                  "owner/documents/" + (doc.id ? doc.id + "/" : ""),
                  doc.id ? "PUT" : "POST",
                  doc,
                );
                setDoc(null);
                await refresh();
                await publicRefresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <FieldInput
              field={{ key: "title", label: "Document title" }}
              value={doc.title}
              onChange={(v) => setDoc({ ...doc, title: String(v) })}
            />
            <label>
              Uploaded PDF
              <select
                required
                value={doc.media || ""}
                onChange={(e) =>
                  setDoc({ ...doc, media: Number(e.target.value) })
                }
              >
                <option value="">Select a PDF</option>
                {assets
                  ?.filter((a) => a.kind === "document")
                  .map((a) => (
                    <option value={a.id} key={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </label>
            {[
              { key: "order", label: "Display order", type: "number" },
              {
                key: "public",
                label: "Approved for public download",
                type: "checkbox",
              },
              {
                key: "profile",
                label: "Company profile document",
                type: "checkbox",
              },
            ].map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={doc[f.key as keyof Doc]}
                onChange={(v) => setDoc({ ...doc, [f.key]: v })}
              />
            ))}
            <div className="actions">
              <button disabled={busy || !dirty}>Save document</button>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  if (!dirty || confirm("Discard unsaved edits?")) setDoc(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
type Enquiry = {
  id: number;
  name: string;
  email: string;
  telephone: string;
  subject: string;
  message: string;
  status: string;
  attempts: number;
  last_error: string;
  read: boolean;
  created_at: string;
};
function Enquiries() {
  const {
    value: items,
    refresh,
    error: loadError,
  } = useLoad<Enquiry[]>("owner/enquiries/");
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Notice error={error || loadError} />
      <p className="muted">
        Saved enquiries remain available even when notifications fail.
        “Accepted” means accepted by the email provider; it does not confirm
        inbox delivery.
      </p>
      <div className="tabs">
        {["all", "unread", "notification issues"].map((f) => (
          <button
            key={f}
            className={filter === f ? "selected" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <button className="ghost" onClick={refresh}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      <div className="panel content-list">
        {items
          ?.filter(
            (e) =>
              filter === "all" ||
              (filter === "unread"
                ? !e.read
                : ["failed", "unknown", "sending"].includes(e.status)),
          )
          .map((e) => (
            <article key={e.id}>
              <Inbox size={20} />
              <div>
                <h3>{e.subject}</h3>
                <p>
                  {e.name} • {new Date(e.created_at).toLocaleString()}
                </p>
                <span
                  className={
                    "badge " + (e.status === "accepted" ? "green" : "amber")
                  }
                >
                  {e.status}
                </span>
                {!e.read && <span className="badge">Unread</span>}
              </div>
              <button
                className="secondary small"
                onClick={async () => {
                  setSelected(e);
                  try {
                    await api(`owner/enquiries/${e.id}/mark_read/`, "POST", {});
                    await refresh();
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                Open
              </button>
            </article>
          ))}
        {items?.length === 0 && (
          <p className="empty">New website enquiries will appear here.</p>
        )}
      </div>
      {selected && (
        <Modal
          title={"Enquiry #" + selected.id}
          close={() => setSelected(null)}
        >
          <Notice error={error} />
          <h2>{selected.subject}</h2>
          <p>
            From {selected.name} •{" "}
            <a href={"mailto:" + selected.email}>{selected.email}</a>
          </p>
          {selected.telephone && (
            <p>
              <a href={"tel:" + selected.telephone}>{selected.telephone}</a>
            </p>
          )}
          <p className="prose">{selected.message}</p>
          <p>
            Notification status: <strong>{selected.status}</strong> • Attempts:{" "}
            {selected.attempts}
          </p>
          {selected.last_error && (
            <p className="error">{selected.last_error}</p>
          )}
          <div className="actions">
            <a
              className="button"
              href={`mailto:${selected.email}?subject=${encodeURIComponent("Re: " + selected.subject)}`}
            >
              Reply by email <ArrowUpRight size={16} />
            </a>
            {selected.status !== "accepted" && (
              <button
                className="secondary"
                disabled={busy}
                onClick={async () => {
                  const ambiguous = ["unknown", "sending"].includes(
                    selected.status,
                  );
                  if (
                    ambiguous &&
                    !confirm(
                      "Check your email provider logs first. Retrying an uncertain send may duplicate a notification. Continue?",
                    )
                  )
                    return;
                  setBusy(true);
                  try {
                    setSelected(
                      await api(
                        `owner/enquiries/${selected.id}/retry/`,
                        "POST",
                        { confirm_possible_duplicate: ambiguous },
                      ),
                    );
                    await refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Sending…" : "Retry notification"}
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
function Account() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="panel account-panel">
      <h2>Change your password</h2>
      <p className="muted">
        Use a unique, strong password. Your account must remain an active staff
        account to access this dashboard.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = e.currentTarget;
          const fd = new FormData(f);
          if (fd.get("new_password") !== fd.get("confirm_password")) {
            setError("New passwords do not match.");
            return;
          }
          setBusy(true);
          setError("");
          try {
            await api("password/", "POST", Object.fromEntries(fd));
            setMessage("Your password has been changed.");
            f.reset();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Current password
          <input
            type="password"
            name="current_password"
            required
            autoComplete="current-password"
          />
        </label>
        <label>
          New password
          <input
            type="password"
            name="new_password"
            required
            autoComplete="new-password"
            minLength={8}
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            name="confirm_password"
            required
            autoComplete="new-password"
          />
        </label>
        <Notice error={error} message={message} />
        <button disabled={busy}>
          {busy ? "Updating…" : "Change password"}
        </button>
      </form>
      <h3>Account recovery</h3>
      <p>
        Contact the authorised server administrator. They can reset your
        password using Django’s interactive <code>changepassword</code> command
        after verifying your identity. Recovery instructions are included in the
        deployment and owner guides.
      </p>
    </div>
  );
}
