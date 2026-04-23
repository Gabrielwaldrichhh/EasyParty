import { useRef, useState, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { uploadImage, type UploadContext } from '../../services/uploadService';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — mesmo limite do backend

interface Props {
  context: UploadContext;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  /** Proporção visual do preview: '1/1' para avatar, '16/9' para banner */
  aspectRatio?: '1/1' | '16/9';
  label?: string;
  disabled?: boolean;
}

/**
 * Componente de upload de imagem reutilizável.
 * Valida tipo + tamanho no cliente, exibe preview local imediato,
 * envia para o backend (que comprime e armazena no Cloudinary)
 * e chama onUploaded com a URL final.
 */
export function ImageUploader({ context, currentUrl, onUploaded, aspectRatio = '16/9', label, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState('');
  const [drag, setDrag] = useState(false);

  const isAvatar = aspectRatio === '1/1';

  function validate(file: File): string | null {
    if (!ACCEPTED.includes(file.type)) return 'Formato inválido. Use JPEG, PNG, WebP ou GIF.';
    if (file.size > MAX_BYTES) return 'Arquivo muito grande. Máximo 8 MB.';
    return null;
  }

  const process = useCallback(async (file: File) => {
    const err = validate(file);
    if (err) { setErro(err); return; }
    setErro('');

    // Preview local imediato antes do upload terminar
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    try {
      const url = await uploadImage(file, context);
      onUploaded(url);
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? 'Erro ao fazer upload. Tente novamente.');
      setPreview(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }, [context, onUploaded]);

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) process(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) process(file);
  }

  function clear(ev: React.MouseEvent) {
    ev.stopPropagation();
    setPreview(null);
    setErro('');
    onUploaded('');
  }

  const displayUrl = preview ?? currentUrl;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={disabled ? undefined : onDrop}
        className={[
          'relative overflow-hidden border-2 border-dashed rounded-xl transition-all cursor-pointer select-none',
          isAvatar ? 'w-20 h-20 rounded-full mx-auto' : 'w-full',
          drag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 hover:bg-accent/30',
          disabled ? 'pointer-events-none opacity-60' : '',
        ].join(' ')}
        style={!isAvatar ? { aspectRatio } : undefined}
      >
        {/* Imagem atual ou preview */}
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground p-3">
            <ImageIcon className={isAvatar ? 'w-6 h-6' : 'w-8 h-8'} />
            {!isAvatar && (
              <p className="text-xs text-center leading-tight">
                Arraste ou clique para adicionar imagem<br />
                <span className="text-[10px] opacity-70">JPEG, PNG, WebP, GIF — máx. 8 MB</span>
              </p>
            )}
          </div>
        )}

        {/* Overlay de upload em andamento */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        {/* Overlay de hover quando já tem imagem */}
        {displayUrl && !uploading && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Upload className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Botão de remover imagem */}
        {displayUrl && !uploading && !disabled && (
          <button
            type="button"
            onClick={clear}
            className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {erro && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-2.5 py-1.5">
          {erro}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={onInputChange}
        disabled={disabled || uploading}
      />
    </div>
  );
}
