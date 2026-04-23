import { useState } from "react";
import { X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ui/ImageUploader";
import type { VenueType, CreateVenuePayload } from "../../types";

interface Props {
  lat: number;
  lng: number;
  onSubmit: (payload: CreateVenuePayload) => Promise<void>;
  onClose: () => void;
}

const TIPOS_LOCAL: { value: VenueType; label: string; emoji: string }[] = [
  { value: 'NIGHTCLUB',   label: 'Balada',        emoji: '🕺' },
  { value: 'BAR',         label: 'Bar',           emoji: '🍺' },
  { value: 'RESTAURANT',  label: 'Restaurante',   emoji: '🍽️' },
  { value: 'EVENT_SPACE', label: 'Espaço',        emoji: '🏟️' },
  { value: 'OUTDOOR',     label: 'Ao ar livre',   emoji: '🌳' },
  { value: 'PRIVATE',     label: 'Privado',       emoji: '🏠' },
  { value: 'OTHER',       label: 'Outro',         emoji: '📍' },
];

export function RegisterVenueModal({ lat, lng, onSubmit, onClose }: Props) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    tipo: 'OTHER' as VenueType,
    endereco: '',
    cidade: '',
    estado: '',
    imageUrl: '',
  });

  function set(campo: string, valor: string) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('O nome do local é obrigatório'); return; }
    setErro('');
    setCarregando(true);
    try {
      await onSubmit({
        name: form.nome.trim(),
        description: form.descricao.trim() || undefined,
        type: form.tipo,
        latitude: lat,
        longitude: lng,
        address: form.endereco.trim() || undefined,
        city: form.cidade.trim() || undefined,
        state: form.estado.trim() || undefined,
        imageUrl: form.imageUrl || undefined,
      });
      onClose();
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao cadastrar local');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-50 bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Cadastrar local</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {erro && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Tipo do local</label>
            <div className="grid grid-cols-4 gap-1.5">
              {TIPOS_LOCAL.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('tipo', t.value)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs transition-all ${
                    form.tipo === t.value
                      ? 'border-foreground bg-accent font-semibold'
                      : 'border-border text-muted-foreground hover:bg-accent/50'
                  }`}
                >
                  <span className="text-base">{t.emoji}</span>
                  <span className="leading-tight text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do local *</label>
            <Input placeholder="Ex: Clube Infinity" value={form.nome} onChange={e => set('nome', e.target.value)} required />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
            <textarea
              placeholder="Sobre o local..."
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Endereço</label>
            <Input placeholder="Rua, número..." value={form.endereco} onChange={e => set('endereco', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cidade</label>
              <Input placeholder="Blumenau" value={form.cidade} onChange={e => set('cidade', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Estado</label>
              <Input placeholder="SC" value={form.estado} onChange={e => set('estado', e.target.value)} />
            </div>
          </div>

          <ImageUploader
            context="venue"
            label="Foto do local"
            aspectRatio="16/9"
            currentUrl={form.imageUrl}
            onUploaded={url => set('imageUrl', url)}
            disabled={carregando}
          />

          <Button
            type="submit"
            disabled={carregando}
            className="w-full bg-gradient-to-r from-[#ee2525] to-[#fdbb2d] text-white font-semibold rounded-xl h-11"
          >
            {carregando ? 'Cadastrando...' : 'Cadastrar local'}
          </Button>
        </form>
      </div>
    </div>
  );
}
