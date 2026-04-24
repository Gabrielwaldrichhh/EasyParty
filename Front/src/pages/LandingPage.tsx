import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Zap, Users, Star, ArrowRight, ChevronDown,
  Eye, EyeOff, Mail, Lock, User, Check, Menu, X,
  Calendar, TrendingUp, Shield, Smartphone,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import logo from "../img/logoo-new-png.png";

// ─── Constantes visuais ──────────────────────────────────────────────────────

const BRAND = "linear-gradient(135deg, #ee2525 0%, #f5711a 55%, #fdbb2d 100%)";

const CATEGORIAS = [
  { emoji: "🎉", label: "Festas",       cor: "#ee2525" },
  { emoji: "🎤", label: "Shows",        cor: "#8b5cf6" },
  { emoji: "🎪", label: "Festivais",    cor: "#f59e0b" },
  { emoji: "⚽", label: "Esportes",     cor: "#10b981" },
  { emoji: "🍽️", label: "Gastronomia", cor: "#f97316" },
  { emoji: "🎮", label: "E-Sports",     cor: "#06b6d4" },
  { emoji: "🛠️", label: "Workshops",   cor: "#0ea5e9" },
  { emoji: "🤝", label: "Networking",   cor: "#3b82f6" },
];

const STATS = [
  { valor: "2.400+", label: "eventos cadastrados" },
  { valor: "18",     label: "cidades cobertas" },
  { valor: "47 mil", label: "usuários ativos" },
  { valor: "4.8★",   label: "avaliação média" },
];

const FEATURES = [
  {
    icon: MapPin,
    titulo: "Mapa em tempo real",
    descricao: "Veja todos os eventos perto de você num mapa interativo. Filtros por categoria, preço e horário.",
    cor: "#ee2525",
  },
  {
    icon: Zap,
    titulo: "Hype Score",
    descricao: "Saiba quais eventos estão bombando agora. Indicador de popularidade atualizado a cada minuto.",
    cor: "#f59e0b",
  },
  {
    icon: Users,
    titulo: "Check-in com GPS",
    descricao: "Faça check-in nos eventos com validação por geolocalização. Mostre que você estava lá.",
    cor: "#10b981",
  },
  {
    icon: TrendingUp,
    titulo: "Analytics para organizadores",
    descricao: "Visualizações, check-ins e alcance do seu evento em tempo real. Dados para tomar decisões.",
    cor: "#8b5cf6",
  },
  {
    icon: Calendar,
    titulo: "Agenda completa",
    descricao: "Favoritos salvos, eventos passados e próximos. Nunca mais perca um evento da sua cidade.",
    cor: "#06b6d4",
  },
  {
    icon: Shield,
    titulo: "Venue verificado",
    descricao: "Locais verificados com histórico de eventos. Segurança para organizadores e participantes.",
    cor: "#ec4899",
  },
];

const PLANOS = [
  {
    nome: "Gratuito",
    preco: "R$ 0",
    periodo: "para sempre",
    cor: "#6b7280",
    destaque: false,
    items: [
      "Descoberta ilimitada no mapa",
      "Check-in em eventos",
      "1 evento ativo por vez",
      "Perfil público",
    ],
    cta: "Começar grátis",
  },
  {
    nome: "Pro",
    preco: "R$ 29,99",
    periodo: "por mês",
    cor: "#ee2525",
    destaque: true,
    items: [
      "Tudo do plano gratuito",
      "Eventos ilimitados",
      "5 boosts de visibilidade/mês",
      "Analytics em tempo real",
      "Suporte prioritário",
      "Venue verificado",
    ],
    cta: "Assinar Pro",
  },
];

const DEPOIMENTOS = [
  {
    nome: "Camila R.",
    cidade: "Blumenau, SC",
    avatar: "CR",
    texto: "Em duas semanas minha festa já tinha 3x mais participantes do que o esperado. O boost do FervoMap é real.",
    estrelas: 5,
  },
  {
    nome: "Diego M.",
    cidade: "Florianópolis, SC",
    texto: "Nunca mais fiquei sem saber o que rolar no fim de semana. O mapa é viciante.",
    avatar: "DM",
    estrelas: 5,
  },
  {
    nome: "Priya S.",
    cidade: "Joinville, SC",
    texto: "Organizei meu primeiro workshop e o check-in com GPS foi impressionante. Muito profissional.",
    avatar: "PS",
    estrelas: 5,
  },
];

// ─── Componentes internos ────────────────────────────────────────────────────

function Campo({
  icon: Icon, label, type = "text", placeholder, value, onChange, required, hint,
}: {
  icon: React.ElementType; label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean; hint?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-white/80 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
        <input
          type={isPass ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          autoComplete={isPass ? "new-password" : undefined}
          className="w-full h-11 pl-10 pr-10 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/35 focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all"
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint}
    </div>
  );
}

function StatusBadge({ status }: { status: "idle" | "checking" | "available" | "taken" }) {
  if (status === "idle") return null;
  if (status === "checking")
    return <p className="text-[11px] text-white/60 flex items-center gap-1.5"><span className="w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin inline-block" />Verificando...</p>;
  if (status === "available")
    return <p className="text-[11px] text-green-300 font-semibold">✓ Disponível</p>;
  return <p className="text-[11px] text-red-300 font-semibold">✗ Já está em uso</p>;
}

// Formulário de cadastro inline usado no Hero e no CTA final
function FormCadastro({ tema }: { tema: "escuro" | "claro" }) {
  const { login, register, loading, error, setError } = useAuth();
  const [modo, setModo] = useState<"login" | "registro">("registro");
  const [f, setF] = useState({ username: "", email: "", senha: "", confirmar: "" });
  const [loginF, setLoginF] = useState({ username: "", senha: "" });
  const [uStatus, setUStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [eStatus, setEStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const uTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onUsername(v: string) {
    setF(p => ({ ...p, username: v }));
    setUStatus("idle"); setSugestoes([]);
    if (uTimer.current) clearTimeout(uTimer.current);
    if (v.length < 3) return;
    setUStatus("checking");
    uTimer.current = setTimeout(async () => {
      const r = await authService.checkUsername(v);
      setUStatus(r.available ? "available" : "taken");
      setSugestoes(r.available ? [] : r.suggestions);
    }, 600);
  }

  function onEmail(v: string) {
    setF(p => ({ ...p, email: v }));
    setEStatus("idle");
    if (eTimer.current) clearTimeout(eTimer.current);
    if (!v.includes("@")) return;
    setEStatus("checking");
    eTimer.current = setTimeout(async () => {
      const r = await authService.checkEmail(v);
      setEStatus(r.available ? "available" : "taken");
    }, 600);
  }

  const reqs = [
    { ok: f.senha.length >= 8,          label: "8+ caracteres" },
    { ok: /[A-Z]/.test(f.senha),        label: "Maiúscula" },
    { ok: /[0-9]/.test(f.senha),        label: "Número" },
    { ok: /[^a-zA-Z0-9]/.test(f.senha), label: "Especial" },
  ];
  const senhaOk = reqs.every(r => r.ok);

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    if (uStatus === "taken") { setError("Username já em uso"); return; }
    if (eStatus === "taken") { setError("E-mail já em uso"); return; }
    if (f.senha !== f.confirmar) { setError("Senhas não coincidem"); return; }
    if (!senhaOk) { setError("Senha não atende aos requisitos"); return; }
    await register(f.username, f.email, f.senha);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await login(loginF.username, loginF.senha);
  }

  const cardBg = tema === "escuro"
    ? "bg-white/10 border-white/20"
    : "bg-white border-white/10 shadow-2xl";

  return (
    <div className={`rounded-2xl border backdrop-blur-md p-6 flex flex-col gap-4 ${cardBg}`}>
      {/* Tabs */}
      <div className="flex bg-black/20 rounded-xl p-1 gap-1">
        {(["registro", "login"] as const).map(m => (
          <button key={m} type="button" onClick={() => { setModo(m); setError(""); }}
            className={`flex-1 h-8 rounded-lg text-sm font-semibold transition-all ${
              modo === m
                ? "bg-white text-[#ee2525] shadow-sm"
                : tema === "escuro" ? "text-white/60 hover:text-white" : "text-gray-500 hover:text-gray-800"
            }`}>
            {m === "registro" ? "Criar conta" : "Entrar"}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      {modo === "registro" ? (
        <form onSubmit={handleRegistro} className="flex flex-col gap-3">
          <Campo icon={User} label="Usuário" placeholder="seunome" value={f.username} onChange={onUsername} required
            hint={<>
              <StatusBadge status={uStatus} />
              {uStatus === "taken" && sugestoes.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {sugestoes.map(s => (
                    <button key={s} type="button"
                      onClick={() => { setF(p => ({ ...p, username: s })); setUStatus("available"); setSugestoes([]); }}
                      className="text-[11px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-full transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </>}
          />
          <Campo icon={Mail} label="E-mail" type="email" placeholder="voce@email.com" value={f.email} onChange={onEmail} required
            hint={<StatusBadge status={eStatus} />}
          />
          <Campo icon={Lock} label="Senha" type="password" placeholder="Mín. 8 caracteres" value={f.senha} onChange={v => setF(p => ({ ...p, senha: v }))} required
            hint={f.senha.length > 0 ? (
              <div className="flex flex-col gap-1">
                <div className="flex gap-1 mt-0.5">
                  {reqs.map((r, i) => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all"
                      style={{ background: r.ok ? "#4ade80" : "rgba(255,255,255,0.15)" }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {reqs.map((r, i) => (
                    <span key={i} className="text-[10px] flex items-center gap-1"
                      style={{ color: r.ok ? "#4ade80" : "rgba(255,255,255,0.35)" }}>
                      {r.ok ? "✓" : "○"} {r.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          />
          <Campo icon={Lock} label="Confirmar senha" type="password" placeholder="Repita a senha" value={f.confirmar} onChange={v => setF(p => ({ ...p, confirmar: v }))} required />
          <button type="submit" disabled={loading}
            className="mt-1 w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg text-white"
            style={{ background: BRAND }}>
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>Criar minha conta</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <Campo icon={User} label="Usuário ou e-mail" placeholder="seunome ou voce@email.com" value={loginF.username} onChange={v => setLoginF(p => ({ ...p, username: v }))} required />
          <Campo icon={Lock} label="Senha" type="password" placeholder="Sua senha" value={loginF.senha} onChange={v => setLoginF(p => ({ ...p, senha: v }))} required />
          <button type="submit" disabled={loading}
            className="mt-1 w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg text-white"
            style={{ background: BRAND }}>
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>Entrar</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      )}

      <p className={`text-center text-[10px] ${tema === "escuro" ? "text-white/35" : "text-gray-400"}`}>
        Ao continuar, você concorda com nossos{" "}
        <span className="underline cursor-pointer">Termos de uso</span>
      </p>
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar({ onCtaClick }: { onCtaClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navLinks = [
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Planos", href: "#planos" },
  ];

  function scrollTo(href: string) {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
    setMenu(false);
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-black/80 backdrop-blur-lg border-b border-white/10 py-3" : "py-5"
    }`}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
            <img src={logo} alt="" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">FervoMap</span>
        </button>

        {/* Links desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <button key={l.href} onClick={() => scrollTo(l.href)}
              className="text-sm text-white/70 hover:text-white transition-colors font-medium">
              {l.label}
            </button>
          ))}
        </div>

        {/* CTAs desktop */}
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => navigate("/login")}
            className="text-sm text-white/70 hover:text-white font-medium transition-colors px-4 h-9">
            Entrar
          </button>
          <button onClick={onCtaClick}
            className="h-9 px-5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-lg shadow-red-900/30"
            style={{ background: BRAND }}>
            Começar grátis
          </button>
        </div>

        {/* Menu mobile */}
        <button onClick={() => setMenu(v => !v)} className="md:hidden text-white/80 hover:text-white">
          {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Drawer mobile */}
      {menu && (
        <div className="md:hidden bg-black/90 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex flex-col gap-3">
          {navLinks.map(l => (
            <button key={l.href} onClick={() => scrollTo(l.href)}
              className="text-sm text-white/70 hover:text-white text-left py-2 font-medium transition-colors">
              {l.label}
            </button>
          ))}
          <div className="pt-2 flex flex-col gap-2 border-t border-white/10">
            <button onClick={() => { navigate("/login"); setMenu(false); }}
              className="h-10 rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors">
              Entrar
            </button>
            <button onClick={() => { onCtaClick(); setMenu(false); }}
              className="h-10 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: BRAND }}>
              Começar grátis
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Seção Hero ───────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20"
      style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #1a0505 40%, #0f0705 100%)" }}>

      {/* Gradiente decorativo de fundo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #ee2525 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #fdbb2d 0%, transparent 70%)" }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 w-full py-16 grid lg:grid-cols-2 gap-12 items-center">

        {/* Texto */}
        <div className="flex flex-col gap-6">
          {/* Badge */}
          <div className="flex">
            <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 rounded-full px-4 py-1.5 text-xs text-white/70 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Eventos acontecendo agora na sua cidade
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight">
            Descubra os melhores{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: BRAND }}>
              eventos regionais
            </span>{" "}
            perto de você
          </h1>

          <p className="text-base sm:text-lg text-white/55 leading-relaxed max-w-lg">
            FervoMap é o mapa interativo de eventos da sua cidade. Festas, shows, festivais,
            workshops e muito mais — tudo em tempo real, com check-in por GPS e ranking de popularidade.
          </p>

          {/* Mini-stats */}
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {STATS.map(s => (
              <div key={s.label} className="flex flex-col">
                <span className="text-xl font-black text-white">{s.valor}</span>
                <span className="text-xs text-white/45">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Categorias animadas */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map(c => (
              <span key={c.label}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all hover:scale-105 cursor-default"
                style={{ borderColor: c.cor + "60", color: c.cor, background: c.cor + "15" }}>
                {c.emoji} {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Formulário Hero */}
        <div className="lg:pl-6">
          <p className="text-white/50 text-sm mb-3 text-center">
            Já são <strong className="text-white/80">47 mil pessoas</strong> descobrindo eventos com a gente
          </p>
          <FormCadastro tema="escuro" />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> Gratuito para sempre</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> Sem cartão de crédito</span>
          </div>
        </div>
      </div>

      {/* Seta scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/25 animate-bounce">
        <ChevronDown className="w-6 h-6" />
      </div>
    </section>
  );
}

// ─── Como funciona ───────────────────────────────────────────────────────────

function ComoFunciona() {
  const steps = [
    { num: "01", titulo: "Crie sua conta", desc: "Cadastro rápido, sem burocracia. Em 30 segundos você já está dentro.", icon: User },
    { num: "02", titulo: "Abra o mapa",    desc: "Veja todos os eventos ao redor em tempo real. Filtre pelo que importa.", icon: MapPin },
    { num: "03", titulo: "Vá ao evento",   desc: "Faça check-in com GPS, interaja com outras pessoas e avalie.", icon: Smartphone },
    { num: "04", titulo: "Crie o seu",     desc: "Organizadores criam eventos em segundos e acompanham analytics.", icon: TrendingUp },
  ];

  return (
    <section id="como-funciona" className="py-24 bg-black">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest uppercase text-red-500 mb-3 block">Como funciona</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Simples assim</h2>
          <p className="text-white/45 mt-3 max-w-md mx-auto">Do cadastro ao seu primeiro evento em menos de 2 minutos.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="relative flex flex-col gap-4 p-6 rounded-2xl border border-white/8 bg-white/3 hover:border-white/15 transition-all group">
              {/* Conectar com linha */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-6 h-px bg-white/10 z-10" />
              )}
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black bg-clip-text text-transparent opacity-30"
                  style={{ backgroundImage: BRAND }}>{s.num}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BRAND + "30", border: `1px solid ${BRAND}30` }}>
                  <s.icon className="w-4 h-4 text-red-400" />
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-base mb-1">{s.titulo}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Funcionalidades ─────────────────────────────────────────────────────────

function Funcionalidades() {
  return (
    <section id="funcionalidades" className="py-24" style={{ background: "#0d0d0d" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest uppercase text-red-500 mb-3 block">Funcionalidades</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Tudo que você precisa</h2>
          <p className="text-white/45 mt-3 max-w-md mx-auto">Para quem vai aos eventos e para quem organiza.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.titulo}
              className="p-6 rounded-2xl border border-white/8 bg-white/2 hover:border-white/15 hover:bg-white/4 transition-all group flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: f.cor + "20", border: `1px solid ${f.cor}35` }}>
                <f.icon className="w-5 h-5" style={{ color: f.cor }} />
              </div>
              <div>
                <h3 className="text-white font-bold text-base mb-2">{f.titulo}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MapaPreviewCta() {
  const navigate = useNavigate();
  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center pb-6"
      style={{ background: "linear-gradient(to top, #000000cc, transparent)" }}>
      <p className="text-white/60 text-sm">
        Abra o mapa completo →{" "}
        <button onClick={() => navigate("/app")} className="text-red-400 font-semibold hover:text-red-300 transition-colors">
          Explorar agora
        </button>
      </p>
    </div>
  );
}

// ─── Mapa preview ─────────────────────────────────────────────────────────────

function MapaPreview() {
  const pins = [
    { top: "28%", left: "35%", emoji: "🎉", label: "Open Bar",   cor: "#ee2525", hype: 94, pulse: true },
    { top: "50%", left: "60%", emoji: "🎤", label: "Show Rock",  cor: "#8b5cf6", hype: 81, pulse: true },
    { top: "65%", left: "25%", emoji: "🍽️", label: "Gastrofest", cor: "#f97316", hype: 67, pulse: false },
    { top: "20%", left: "70%", emoji: "🎮", label: "LAN Party",  cor: "#06b6d4", hype: 58, pulse: false },
    { top: "75%", left: "72%", emoji: "🎪", label: "Festival",   cor: "#f59e0b", hype: 73, pulse: false },
  ];

  return (
    <section className="py-24 bg-black overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-red-500 mb-3 block">Mapa interativo</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Sua cidade em tempo real</h2>
          <p className="text-white/45 mt-3">Cada ponto é um evento acontecendo agora. Cores por categoria, tamanho pelo hype.</p>
        </div>

        {/* Mock do mapa */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
          style={{ height: "420px", background: "#111827" }}>

          {/* Grade estilo mapa */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }} />

          {/* Ruas simuladas */}
          <div className="absolute top-[40%] left-0 right-0 h-px bg-white/8" />
          <div className="absolute top-[65%] left-0 right-0 h-px bg-white/8" />
          <div className="absolute top-0 bottom-0 left-[45%] w-px bg-white/8" />
          <div className="absolute top-0 bottom-0 left-[70%] w-px bg-white/8" />

          {/* Pins */}
          {pins.map(p => (
            <div key={p.label} className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-full"
              style={{ top: p.top, left: p.left }}>
              {p.pulse && (
                <div className="absolute w-14 h-14 rounded-full opacity-30 animate-ping"
                  style={{ background: p.cor, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
              )}
              <div className="relative w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg border-2 border-white/20"
                style={{ background: p.cor + "dd" }}>
                {p.emoji}
              </div>
              <div className="bg-black/80 border border-white/10 rounded-lg px-2 py-1 whitespace-nowrap">
                <p className="text-white text-[10px] font-semibold">{p.label}</p>
                <p className="text-[9px] font-bold" style={{ color: p.cor }}>🔥 {p.hype} hype</p>
              </div>
            </div>
          ))}

          {/* Overlay de CTA */}
          <MapaPreviewCta />
        </div>
      </div>
    </section>
  );
}

// ─── Para organizadores ──────────────────────────────────────────────────────

function ParaOrganizadores() {
  const navigate = useNavigate();
  const beneficios = [
    "Crie seu evento em menos de 2 minutos",
    "Acompanhe visualizações e check-ins em tempo real",
    "Turbine sua visibilidade com boost patrocinado",
    "Gerencie múltiplos venues no mesmo painel",
    "Receba o badge de organizador verificado",
    "Integração com vendas de ingresso em breve",
  ];

  return (
    <section className="py-24" style={{ background: "#0a0a0a" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-red-500 mb-3 block">Para organizadores</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Seus eventos<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: BRAND }}>
                  na palm da mão
                </span>
              </h2>
            </div>
            <p className="text-white/50 text-base leading-relaxed">
              Crie, gerencie e promova seus eventos com ferramentas profissionais.
              Do bar de esquina ao festival de mil pessoas.
            </p>

            <div className="flex flex-col gap-3">
              {beneficios.map(b => (
                <div key={b} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: BRAND }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white/70 text-sm">{b}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 flex-wrap">
              <a href="#planos"
                onClick={e => { e.preventDefault(); document.querySelector("#planos")?.scrollIntoView({ behavior: "smooth" }); }}
                className="h-11 px-6 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-all hover:opacity-90"
                style={{ background: BRAND }}>
                Ver planos <ArrowRight className="w-4 h-4" />
              </a>
              <button onClick={() => navigate("/app")}
                className="h-11 px-6 rounded-xl font-bold text-sm text-white/70 border border-white/15 flex items-center gap-2 hover:border-white/30 hover:text-white transition-all">
                Ver demonstração
              </button>
            </div>
          </div>

          {/* Card de analytics mockado */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Visualizações hoje", valor: "1.847", delta: "+23%", cor: "#ee2525" },
              { label: "Check-ins",          valor: "342",   delta: "+41%", cor: "#10b981" },
              { label: "Hype score",         valor: "94/100", delta: "🔥 Bombando", cor: "#f59e0b" },
              { label: "Alcance estimado",   valor: "8.200", delta: "+12%", cor: "#8b5cf6" },
            ].map(m => (
              <div key={m.label} className="p-5 rounded-2xl border border-white/8 bg-white/3 flex flex-col gap-2">
                <p className="text-white/40 text-xs">{m.label}</p>
                <p className="text-white text-2xl font-black">{m.valor}</p>
                <p className="text-xs font-semibold" style={{ color: m.cor }}>{m.delta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Depoimentos ─────────────────────────────────────────────────────────────

function Depoimentos() {
  return (
    <section className="py-24 bg-black">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-red-500 mb-3 block">Depoimentos</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Quem usa, recomenda</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {DEPOIMENTOS.map(d => (
            <div key={d.nome} className="p-6 rounded-2xl border border-white/8 bg-white/2 flex flex-col gap-4">
              <div className="flex">
                {Array.from({ length: d.estrelas }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-white/65 text-sm leading-relaxed">"{d.texto}"</p>
              <div className="flex items-center gap-3 mt-auto pt-2 border-t border-white/8">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background: BRAND }}>
                  {d.avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{d.nome}</p>
                  <p className="text-white/35 text-xs flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />{d.cidade}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Planos ───────────────────────────────────────────────────────────────────

function Planos() {
  const navigate = useNavigate();
  return (
    <section id="planos" className="py-24" style={{ background: "#0d0d0d" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-red-500 mb-3 block">Planos</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Transparente e justo</h2>
          <p className="text-white/45 mt-3">Comece grátis. Evolua quando precisar.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANOS.map(p => (
            <div key={p.nome}
              className={`relative p-8 rounded-2xl flex flex-col gap-6 transition-all ${
                p.destaque
                  ? "border-2 shadow-2xl"
                  : "border border-white/10 bg-white/2"
              }`}
              style={p.destaque
                ? { borderColor: p.cor, background: "linear-gradient(160deg, #1a0505 0%, #0a0a0a 100%)", boxShadow: `0 0 60px ${p.cor}20` }
                : {}}>

              {p.destaque && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="text-xs font-black text-white px-4 py-1 rounded-full"
                    style={{ background: BRAND }}>
                    MAIS POPULAR
                  </span>
                </div>
              )}

              <div>
                <p className="text-white/60 text-sm font-medium mb-1">{p.nome}</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-4xl font-black text-white">{p.preco}</span>
                  <span className="text-white/40 text-sm mb-1">{p.periodo}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {p.items.map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: p.destaque ? BRAND : "#ffffff20" }}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white/65 text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate("/login")}
                className="mt-auto h-11 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
                style={p.destaque
                  ? { background: BRAND, color: "white" }
                  : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.12)" }}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Final ───────────────────────────────────────────────────────────────

function CtaFinal() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "#070707" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, #ee2525 0%, transparent 70%)" }} />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative flex flex-col items-center gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Sua cidade tem{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: BRAND }}>
              muito a oferecer.
            </span>
            <br />Você já está aproveitando?
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Junte-se a 47 mil pessoas que já descobrem eventos regionais com o FervoMap.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <FormCadastro tema="escuro" />
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/8 bg-black py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-4 gap-8 mb-10">
          <div className="sm:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: BRAND }}>
                <img src={logo} alt="" className="w-4 h-4 object-contain" />
              </div>
              <span className="text-white font-bold">FervoMap</span>
            </div>
            <p className="text-white/35 text-xs leading-relaxed max-w-xs">
              O mapa interativo de eventos da sua cidade. Descubra, vá e crie experiências incríveis perto de você.
            </p>
          </div>

          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Produto</p>
            <div className="flex flex-col gap-2">
              {["Como funciona", "Funcionalidades", "Planos", "Para organizadores"].map(l => (
                <a key={l} href="#" className="text-white/35 text-xs hover:text-white/70 transition-colors">{l}</a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Legal</p>
            <div className="flex flex-col gap-2">
              {["Termos de uso", "Privacidade", "Cookies"].map(l => (
                <a key={l} href="#" className="text-white/35 text-xs hover:text-white/70 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/25 text-xs">© 2025 FervoMap. Todos os direitos reservados.</p>
          <p className="text-white/20 text-xs">Feito com ❤️ para eventos regionais brasileiros</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export function LandingPage() {
  const ctaRef = useRef<HTMLDivElement>(null);

  function scrollToCta() {
    ctaRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      <Navbar onCtaClick={scrollToCta} />
      <Hero />
      <ComoFunciona />
      <Funcionalidades />
      <MapaPreview />
      <ParaOrganizadores />
      <Depoimentos />
      <Planos />
      <div ref={ctaRef}>
        <CtaFinal />
      </div>
      <Footer />
    </div>
  );
}
