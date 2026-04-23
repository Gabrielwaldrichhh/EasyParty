import { useState, useRef } from "react";
import { Search, X, MapPin, Building2, Map } from "lucide-react";
import L from "leaflet";

interface Props {
  map: React.RefObject<L.Map | null>;
}

interface ResultadoNominatim {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
  importance: number;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  boundingbox?: [string, string, string, string];
}

function getIcon(r: ResultadoNominatim) {
  const cls = r.class;
  const type = r.type;
  if (cls === 'boundary' || type === 'city' || type === 'town' || type === 'village' || type === 'municipality') {
    return <Map className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
  }
  if (cls === 'amenity' || cls === 'shop' || cls === 'tourism' || cls === 'leisure') {
    return <Building2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />;
  }
  return <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
}

function getZoom(r: ResultadoNominatim): number {
  const type = r.type;
  if (type === 'country') return 5;
  if (type === 'state') return 7;
  if (type === 'city' || type === 'municipality') return 13;
  if (type === 'town') return 14;
  if (type === 'village' || type === 'suburb') return 15;
  if (type === 'road' || type === 'street') return 16;
  return 17;
}

function formatTitle(r: ResultadoNominatim): string {
  if (r.address) {
    return (
      r.address.road ||
      r.address.suburb ||
      r.address.city ||
      r.address.town ||
      r.address.village ||
      r.display_name.split(',')[0]
    );
  }
  return r.display_name.split(',')[0];
}

function formatSubtitle(r: ResultadoNominatim): string {
  const parts: string[] = [];
  if (r.address) {
    if (r.address.city || r.address.town || r.address.village) {
      parts.push((r.address.city || r.address.town || r.address.village)!);
    }
    if (r.address.state) parts.push(r.address.state);
    if (r.address.country) parts.push(r.address.country);
  }
  if (parts.length === 0) {
    return r.display_name.split(',').slice(1, 3).join(',').trim();
  }
  return parts.join(', ');
}

async function buscarNominatim(query: string): Promise<ResultadoNominatim[]> {
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    limit: '8',
    addressdetails: '1',
    'accept-language': 'pt-BR',
  });

  // Duas buscas em paralelo: uma global, uma priorizando Brasil
  const [global, brasil] = await Promise.all([
    fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
    }).then(r => r.json() as Promise<ResultadoNominatim[]>),

    fetch(`https://nominatim.openstreetmap.org/search?${params}&countrycodes=br`, {
      headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
    }).then(r => r.json() as Promise<ResultadoNominatim[]>),
  ]);

  // Mescla: resultados do Brasil primeiro, depois globais não duplicados
  const seen = new Set<number>();
  const merged: ResultadoNominatim[] = [];

  for (const r of [...brasil, ...global]) {
    if (!seen.has(r.place_id)) {
      seen.add(r.place_id);
      merged.push(r);
    }
  }

  // Ordena por importância e limita a 7
  return merged
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
    .slice(0, 7);
}

export function MapSearch({ map }: Props) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ResultadoNominatim[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [semResultados, setSemResultados] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value;
    setBusca(valor);
    setSemResultados(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!valor.trim() || valor.trim().length < 2) {
      setResultados([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setCarregando(true);
      try {
        const data = await buscarNominatim(valor.trim());
        setResultados(data);
        setSemResultados(data.length === 0);
      } catch {
        setResultados([]);
        setSemResultados(false);
      } finally {
        setCarregando(false);
      }
    }, 500);
  }

  function irPara(r: ResultadoNominatim) {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    const zoom = getZoom(r);

    if (r.boundingbox && (r.type === 'city' || r.type === 'town' || r.type === 'municipality' || r.class === 'boundary')) {
      const [s, n, w, e] = r.boundingbox.map(Number);
      map.current?.fitBounds([[s, w], [n, e]], { animate: true, padding: [40, 40] });
    } else {
      map.current?.flyTo([lat, lon], zoom, { animate: true, duration: 1.2 });
    }

    setBusca(formatTitle(r));
    setResultados([]);
    setSemResultados(false);
  }

  function limpar() {
    setBusca("");
    setResultados([]);
    setSemResultados(false);
  }

  const mostrarDropdown = resultados.length > 0 || (semResultados && busca.trim().length >= 2 && !carregando);

  return (
    <div className="relative w-full">
      <div className="flex items-center bg-background/95 backdrop-blur-sm border border-border rounded-2xl shadow-lg overflow-hidden h-11">
        <Search className="w-4 h-4 ml-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={busca}
          onChange={handleChange}
          placeholder="Buscar cidade, bairro, endereço..."
          className="flex-1 bg-transparent px-3 text-sm outline-none text-foreground placeholder:text-muted-foreground"
        />
        {carregando && (
          <div className="w-4 h-4 mr-3 border-2 border-muted-foreground/40 border-t-muted-foreground rounded-full animate-spin flex-shrink-0" />
        )}
        {busca && !carregando && (
          <button onClick={limpar} className="mr-3 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {mostrarDropdown && (
        <div className="absolute top-12 left-0 right-0 bg-background/98 backdrop-blur-sm border border-border rounded-2xl shadow-xl overflow-hidden z-50">
          {resultados.length > 0 ? resultados.map((r) => (
            <button
              key={r.place_id}
              onClick={() => irPara(r)}
              className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors border-b border-border/60 last:border-0 flex items-start gap-2.5"
            >
              <span className="mt-0.5">{getIcon(r)}</span>
              <div className="min-w-0">
                <span className="text-sm font-medium text-foreground block truncate">
                  {formatTitle(r)}
                </span>
                <span className="text-xs text-muted-foreground truncate block">
                  {formatSubtitle(r)}
                </span>
              </div>
            </button>
          )) : (
            <div className="px-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">Nenhum resultado para "<span className="font-medium text-foreground">{busca}</span>"</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tente um nome de cidade, bairro ou endereço</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
