import { useEffect, useState } from "react";
import { Check, User as UserIcon, MapPin, Phone, Calendar, FileText, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ImageUploader } from "./ui/ImageUploader";
import { authService } from "../services/authService";
import type { User } from "../types";

export function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    phone: '',
    city: '',
    state: '',
    birthDate: '',
    avatarUrl: '',
  });

  useEffect(() => {
    authService.getMe()
      .then(u => {
        setUser(u);
        setForm({
          displayName: u.displayName ?? '',
          bio: u.bio ?? '',
          phone: u.phone ?? '',
          city: u.city ?? '',
          state: u.state ?? '',
          birthDate: u.birthDate ? u.birthDate.split('T')[0] : '',
          avatarUrl: u.avatarUrl ?? '',
        });
      })
      .catch(() => {
        // fallback para dados do localStorage
        const stored = authService.getStoredUser();
        if (stored) setUser(stored);
      })
      .finally(() => setLoading(false));
  }, []);

  function set(campo: string, valor: string) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErro('');
    try {
      const updated = await authService.updateProfile({
        displayName: form.displayName || undefined,
        bio: form.bio || undefined,
        phone: form.phone || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        birthDate: form.birthDate ? new Date(form.birthDate + 'T12:00:00').toISOString() : null,
        avatarUrl: form.avatarUrl || null,
      });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      {/* Avatar + nome de exibição */}
      <div className="flex flex-col items-center gap-2 pb-2 border-b border-border">
        <ImageUploader
          context="avatar"
          aspectRatio="1/1"
          currentUrl={form.avatarUrl || user?.avatarUrl}
          onUploaded={url => set('avatarUrl', url)}
          disabled={saving}
        />
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{user?.username}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {erro && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {erro}
        </p>
      )}

      {/* Identidade */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <UserIcon className="w-3 h-3" /> Identidade
        </p>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nome de exibição</label>
          <Input
            placeholder="Como você quer ser chamado?"
            value={form.displayName}
            onChange={e => set('displayName', e.target.value)}
            maxLength={60}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
          <textarea
            placeholder="Conte um pouco sobre você..."
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            maxLength={300}
            rows={2}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right mt-0.5">{form.bio.length}/300</p>
        </div>
      </div>

      {/* Contato */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Phone className="w-3 h-3" /> Contato
        </p>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Telefone / WhatsApp</label>
          <Input
            placeholder="(47) 99999-9999"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            maxLength={20}
          />
        </div>
      </div>

      {/* Localização */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3 h-3" /> Localização
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Cidade</label>
            <Input
              placeholder="Blumenau"
              value={form.city}
              onChange={e => set('city', e.target.value)}
              maxLength={60}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
            <Input
              placeholder="SC"
              value={form.state}
              onChange={e => set('state', e.target.value)}
              maxLength={40}
            />
          </div>
        </div>
      </div>

      {/* Pessoal */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3 h-3" /> Pessoal
        </p>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Data de nascimento</label>
          <Input
            type="date"
            value={form.birthDate}
            onChange={e => set('birthDate', e.target.value)}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={saving}
        className="w-full h-10 text-white font-semibold rounded-xl"
        style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #ee2525, #fdbb2d)' }}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Salvo!</span>
        ) : (
          <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Salvar perfil</span>
        )}
      </Button>
    </form>
  );
}
