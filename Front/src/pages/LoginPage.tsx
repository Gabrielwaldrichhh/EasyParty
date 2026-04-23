import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, MapPin } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import logo from "../img/logoo-new-png.png";

function Field({
  icon: Icon,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: React.ElementType;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-white/90 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          className="
            w-full h-11 pl-10 pr-10 rounded-xl text-sm
            bg-black/25 border border-white/25
            text-white placeholder:text-white/40
            focus:outline-none focus:border-white/70 focus:bg-black/30
            transition-all
          "
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function Divisor() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-white/20" />
      <span className="text-xs text-white/40 font-medium">ou</span>
      <div className="flex-1 h-px bg-white/20" />
    </div>
  );
}

function BotaoGoogle({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      title="Em breve"
      className="
        w-full h-11 flex items-center justify-center gap-3
        rounded-xl border border-white/20 bg-white/10
        text-white/50 text-sm font-medium
        cursor-not-allowed opacity-60 transition-all
      "
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
        <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3L16.04 18.013z"/>
        <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
        <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
      </svg>
      {label}
      <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded-full">Em breve</span>
    </button>
  );
}

export function LoginPage() {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const { login, register, loading, error, setError } = useAuth();

  const [formLogin, setFormLogin] = useState({ username: "", senha: "" });
  const [formRegistro, setFormRegistro] = useState({ username: "", email: "", senha: "", confirmar: "" });

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleUsernameChange(v: string) {
    setFormRegistro(f => ({ ...f, username: v }));
    setUsernameStatus("idle");
    setUsernameSuggestions([]);
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (v.length < 3) return;
    setUsernameStatus("checking");
    usernameTimer.current = setTimeout(async () => {
      const { available, suggestions } = await authService.checkUsername(v);
      setUsernameStatus(available ? "available" : "taken");
      setUsernameSuggestions(available ? [] : suggestions);
    }, 600);
  }

  function handleEmailChange(v: string) {
    setFormRegistro(f => ({ ...f, email: v }));
    setEmailStatus("idle");
    if (emailTimer.current) clearTimeout(emailTimer.current);
    if (!v.includes("@")) return;
    setEmailStatus("checking");
    emailTimer.current = setTimeout(async () => {
      const { available } = await authService.checkEmail(v);
      setEmailStatus(available ? "available" : "taken");
    }, 600);
  }

  useEffect(() => () => {
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (emailTimer.current) clearTimeout(emailTimer.current);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await login(formLogin.username, formLogin.senha);
  }

  const senhaReqs = [
    { ok: formRegistro.senha.length >= 8,           label: "Mínimo 8 caracteres" },
    { ok: /[A-Z]/.test(formRegistro.senha),         label: "Uma letra maiúscula" },
    { ok: /[0-9]/.test(formRegistro.senha),         label: "Um número" },
    { ok: /[^a-zA-Z0-9]/.test(formRegistro.senha), label: "Um caractere especial" },
  ];
  const senhaForte = senhaReqs.every(r => r.ok);

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    if (usernameStatus === "taken") { setError("Nome de usuário já está em uso"); return; }
    if (emailStatus === "taken") { setError("E-mail já está em uso"); return; }
    if (formRegistro.senha !== formRegistro.confirmar) { setError("As senhas não coincidem"); return; }
    if (!senhaForte) { setError("A senha não atende aos requisitos mínimos"); return; }
    await register(formRegistro.username, formRegistro.email, formRegistro.senha);
  }

  function trocarModo(proximo: "login" | "registro") {
    setError("");
    setModo(proximo);
    setUsernameStatus("idle");
    setEmailStatus("idle");
    setUsernameSuggestions([]);
  }

  const isLogin = modo === "login";

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: "linear-gradient(145deg, #c0190e 0%, #ee2525 30%, #f5711a 65%, #fdbb2d 100%)" }}
    >
      <div className="absolute top-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[420px] h-[420px] rounded-full bg-black/10 pointer-events-none" />

      <div className="relative w-full max-w-[400px] flex flex-col gap-6">

        {/* Branding */}
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-xl">
            <img src={logo} alt="EasyParty" className="w-10 h-10 object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">EasyParty</h1>
            <p className="text-white/60 text-sm mt-0.5 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" />
              Encontre eventos perto de você
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-black/20 border border-white/25 backdrop-blur-md rounded-3xl p-6 shadow-2xl flex flex-col gap-5">

          {/* Tabs */}
          <div className="flex bg-black/30 rounded-xl p-1">
            <button
              type="button"
              onClick={() => trocarModo("login")}
              className={`flex-1 h-8 rounded-lg text-sm font-semibold transition-all ${
                isLogin ? "bg-white text-[#ee2525] shadow" : "text-white/60 hover:text-white"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => trocarModo("registro")}
              className={`flex-1 h-8 rounded-lg text-sm font-semibold transition-all ${
                !isLogin ? "bg-white text-[#ee2525] shadow" : "text-white/60 hover:text-white"
              }`}
            >
              Criar conta
            </button>
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 bg-black/30 border border-red-400/40 rounded-xl px-3 py-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Formulário Login */}
          {isLogin && (
            <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
              <Field
                icon={User}
                label="Usuário ou e-mail"
                placeholder="seunome ou voce@email.com"
                value={formLogin.username}
                onChange={v => setFormLogin(f => ({ ...f, username: v }))}
                required
              />
              <Field
                icon={Lock}
                label="Senha"
                type="password"
                placeholder="Sua senha"
                value={formLogin.senha}
                onChange={v => setFormLogin(f => ({ ...f, senha: v }))}
                required
              />
              <button type="button" className="text-xs text-white/50 hover:text-white/80 text-right transition-colors -mt-1">
                Esqueceu sua senha?
              </button>
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full h-11 rounded-xl bg-white text-[#ee2525] font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] disabled:opacity-60 transition-all shadow-lg"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-[#ee2525]/30 border-t-[#ee2525] rounded-full animate-spin" />
                  : <> Entrar <ArrowRight className="w-4 h-4" /> </>
                }
              </button>
              <Divisor />
              <BotaoGoogle label="Continuar com Google" />
            </form>
          )}

          {/* Formulário Registro */}
          {!isLogin && (
            <form onSubmit={handleRegistro} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <Field
                  icon={User}
                  label="Nome de usuário"
                  placeholder="seunome (letras, números, _)"
                  value={formRegistro.username}
                  onChange={handleUsernameChange}
                  required
                />
                {usernameStatus === "checking" && (
                  <p className="text-[11px] text-white/80 bg-black/30 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin inline-block flex-shrink-0" />
                    Verificando disponibilidade...
                  </p>
                )}
                {usernameStatus === "available" && (
                  <p className="text-[11px] font-semibold text-green-300 bg-green-950/60 border border-green-500/30 rounded-lg px-2.5 py-1.5">✓ Nome de usuário disponível</p>
                )}
                {usernameStatus === "taken" && (
                  <div className="flex flex-col gap-1.5 bg-red-950/60 border border-red-500/30 rounded-lg px-2.5 py-1.5">
                    <p className="text-[11px] font-semibold text-red-300">✗ Nome de usuário já está em uso</p>
                    {usernameSuggestions.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-white/60">Sugestões:</span>
                        {usernameSuggestions.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => { setFormRegistro(f => ({ ...f, username: s })); setUsernameStatus("available"); setUsernameSuggestions([]); }}
                            className="text-[11px] font-medium bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-full transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Field
                  icon={Mail}
                  label="E-mail"
                  type="email"
                  placeholder="voce@email.com"
                  value={formRegistro.email}
                  onChange={handleEmailChange}
                  required
                />
                {emailStatus === "checking" && (
                  <p className="text-[11px] text-white/80 bg-black/30 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin inline-block flex-shrink-0" />
                    Verificando...
                  </p>
                )}
                {emailStatus === "available" && (
                  <p className="text-[11px] font-semibold text-green-300 bg-green-950/60 border border-green-500/30 rounded-lg px-2.5 py-1.5">✓ E-mail disponível</p>
                )}
                {emailStatus === "taken" && (
                  <p className="text-[11px] font-semibold text-red-300 bg-red-950/60 border border-red-500/30 rounded-lg px-2.5 py-1.5">✗ E-mail já está em uso</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Field
                  icon={Lock}
                  label="Senha"
                  type="password"
                  placeholder="Mín. 8 caracteres"
                  value={formRegistro.senha}
                  onChange={v => setFormRegistro(f => ({ ...f, senha: v }))}
                  required
                />
                {formRegistro.senha.length > 0 && (
                  <div className="flex flex-col gap-1 px-1">
                    <div className="flex gap-1 mt-0.5">
                      {senhaReqs.map((r, i) => (
                        <div
                          key={i}
                          className="flex-1 h-1 rounded-full transition-all"
                          style={{ background: r.ok ? '#4ade80' : 'rgba(255,255,255,0.2)' }}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-0.5">
                      {senhaReqs.map((r, i) => (
                        <span key={i} className="text-[10px] flex items-center gap-1" style={{ color: r.ok ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                          {r.ok ? '✓' : '○'} {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Field
                icon={Lock}
                label="Confirmar senha"
                type="password"
                placeholder="Repita sua senha"
                value={formRegistro.confirmar}
                onChange={v => setFormRegistro(f => ({ ...f, confirmar: v }))}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full h-11 rounded-xl bg-white text-[#ee2525] font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] disabled:opacity-60 transition-all shadow-lg"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-[#ee2525]/30 border-t-[#ee2525] rounded-full animate-spin" />
                  : <> Criar conta <ArrowRight className="w-4 h-4" /> </>
                }
              </button>
              <Divisor />
              <BotaoGoogle label="Cadastrar com Google" />
            </form>
          )}
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs text-white/40">
          Ao continuar, você concorda com nossos{" "}
          <span className="text-white/60 underline cursor-pointer hover:text-white transition-colors">Termos de uso</span>
          {" "}e{" "}
          <span className="text-white/60 underline cursor-pointer hover:text-white transition-colors">Política de privacidade</span>
        </p>
      </div>
    </div>
  );
}
