import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, ArrowRight, CheckCircle } from "lucide-react";
import { authService } from "../services/authService";
import logo from "../img/logoo-new-png.png";

function Field({
  icon: Icon, label, placeholder, value, onChange,
}: {
  icon: React.ElementType; label: string; placeholder: string;
  value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-white/90 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          className="w-full h-11 pl-10 pr-10 rounded-xl text-sm bg-black/25 border border-white/25 text-white placeholder:text-white/40 focus:outline-none focus:border-white/70 transition-all"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const senhaReqs = [
    { ok: senha.length >= 8,           label: "Mínimo 8 caracteres" },
    { ok: /[A-Z]/.test(senha),         label: "Uma maiúscula" },
    { ok: /[0-9]/.test(senha),         label: "Um número" },
    { ok: /[^a-zA-Z0-9]/.test(senha), label: "Um especial" },
  ];
  const senhaForte = senhaReqs.every(r => r.ok);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { setError("Link inválido. Solicite um novo."); return; }
    if (!senhaForte) { setError("A senha não atende aos requisitos mínimos"); return; }
    if (senha !== confirmar) { setError("As senhas não coincidem"); return; }

    setLoading(true);
    setError("");
    try {
      await authService.resetPassword(token, senha);
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: "linear-gradient(145deg, #c0190e 0%, #ee2525 30%, #f5711a 65%, #fdbb2d 100%)" }}
    >
      <div className="relative w-full max-w-[400px] flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-xl">
            <img src={logo} alt="FervoMap" className="w-10 h-10 object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">FervoMap</h1>
            <p className="text-white/60 text-sm mt-0.5">Redefinir senha</p>
          </div>
        </div>

        <div className="bg-black/20 border border-white/25 backdrop-blur-md rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <p className="text-white font-semibold text-center">Senha redefinida com sucesso!</p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full h-11 rounded-xl bg-white text-[#ee2525] font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-all shadow-lg"
              >
                Ir para o login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-white/70">Digite sua nova senha abaixo.</p>

              {error && (
                <div className="flex items-center gap-2 bg-black/30 border border-red-400/40 rounded-xl px-3 py-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Field icon={Lock} label="Nova senha" placeholder="Mín. 8 caracteres" value={senha} onChange={setSenha} />
                {senha.length > 0 && (
                  <div className="flex flex-col gap-1 px-1">
                    <div className="flex gap-1 mt-0.5">
                      {senhaReqs.map((r, i) => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all"
                          style={{ background: r.ok ? '#4ade80' : 'rgba(255,255,255,0.2)' }} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-0.5">
                      {senhaReqs.map((r, i) => (
                        <span key={i} className="text-[10px] flex items-center gap-1"
                          style={{ color: r.ok ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                          {r.ok ? '✓' : '○'} {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Field icon={Lock} label="Confirmar senha" placeholder="Repita a nova senha" value={confirmar} onChange={setConfirmar} />

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full h-11 rounded-xl bg-white text-[#ee2525] font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] disabled:opacity-60 transition-all shadow-lg"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-[#ee2525]/30 border-t-[#ee2525] rounded-full animate-spin" />
                  : <> Redefinir senha <ArrowRight className="w-4 h-4" /> </>
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
