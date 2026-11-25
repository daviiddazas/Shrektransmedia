import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, ImagePlus, RotateCcw, Sparkles, X } from 'lucide-react';
import { DEFAULT_STORY_CONFIG } from '../data/defaultStoryData';
import { GENERATED_TEXTURES } from '../three/proceduralTextures';
import { StoryStation } from '../types/story';
import { normalizePublicImageUrl, parseVideoUrl } from '../utils/storyLogic';

interface StationModalProps {
  station: StoryStation | null;
  onUpdateImage?: (stationId: number, newUrl: string) => void;
  onClose: () => void;
}

export const StationModal: React.FC<StationModalProps> = ({
  station,
  onUpdateImage,
  onClose,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [editingImage, setEditingImage] = useState(false);
  const [imageDraft, setImageDraft] = useState('');
  const [imageFeedback, setImageFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [station?.id, station?.imageUrl]);

  useEffect(() => {
    setEditingImage(false);
    setImageDraft(station?.imageUrl ?? '');
    setImageFeedback(null);
  }, [station?.id]);

  useEffect(() => {
    if (!station) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingImage) {
          setEditingImage(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [station, editingImage, onClose]);

  if (!station) return null;

  const videoInfo = parseVideoUrl(station.videoUrl);
  const hasVideo = videoInfo.kind !== 'none';

  const handleApplyImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const res = normalizePublicImageUrl(imageDraft);
    if (!res.ok) {
      setImageFeedback({ type: 'err', text: res.error ?? 'URL no válida.' });
      return;
    }
    setImgError(false);
    setImgLoaded(false);
    onUpdateImage?.(station.id, res.url);
    setImageDraft(res.url);
    setEditingImage(false);
    setImageFeedback({ type: 'ok', text: 'Imagen actualizada en esta ficha.' });
  };

  const handleRestoreDefaultImage = () => {
    const defUrl =
      DEFAULT_STORY_CONFIG.stations.find((s) => s.id === station.id)?.imageUrl ?? '';
    if (!defUrl) return;
    setImgError(false);
    setImgLoaded(false);
    onUpdateImage?.(station.id, defUrl);
    setImageDraft(defUrl);
    setEditingImage(false);
    setImageFeedback({ type: 'ok', text: 'Imagen original restaurada.' });
  };

  return (
    <aside
      role="region"
      aria-labelledby="station-modal-title"
      data-testid="station-modal"
      className="parchment-panel relative z-20 w-full sm:w-[340px] md:w-[410px] lg:w-[460px] max-h-[46vh] sm:max-h-full sm:h-full shrink-0 overflow-y-auto border-t sm:border-t-0 sm:border-l border-[#8e6a3a]/50 shadow-2xl"
    >
      <div className="p-4 sm:p-6 space-y-4">
        {/* 1. Nombre de la sección */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#7b582e] dark:text-amber-300/80">
              {station.realmName}
            </p>
            <h2
              id="station-modal-title"
              className="font-display text-lg sm:text-2xl font-bold text-[#2d1d0e] dark:text-amber-100 mt-0.5"
            >
              {station.modalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1.5 rounded-lg text-[#5d4024] dark:text-amber-200/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 2. Imagen representativa editable mediante enlace público */}
        <div className="space-y-2">
          <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-[#8e6a3a]/40 bg-[#efe2c4] dark:bg-gradient-to-b dark:from-[#5c4833] dark:to-[#2b2016]">
            {(!imgLoaded || imgError) && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(28, 52, 34, 0.85), rgba(68, 44, 22, 0.88)), url(${GENERATED_TEXTURES.coverCrest})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <Sparkles className="w-7 h-7 text-amber-300" aria-hidden="true" />
                <span className="font-display text-sm font-bold text-amber-100 tracking-wide">
                  {station.realmName}
                </span>
                <span className="font-story italic text-xs text-amber-200/85">
                  {imgError
                    ? 'No se pudo cargar esa imagen pública'
                    : station.intervention.characterName}
                </span>
              </div>
            )}

            {station.imageUrl && !imgError && (
              <img
                src={station.imageUrl}
                alt={station.modalTitle}
                referrerPolicy="no-referrer"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`relative z-10 w-full h-full object-contain transition-opacity duration-300 ${
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}

            {onUpdateImage && (
              <button
                type="button"
                onClick={() => {
                  setImageDraft(station.imageUrl);
                  setImageFeedback(null);
                  setEditingImage((v) => !v);
                }}
                aria-expanded={editingImage}
                className="absolute bottom-2 right-2 z-20 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-[#fff8e8] bg-[#26180c]/85 hover:bg-[#3a2512] border border-amber-300/45 shadow cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                <span>{editingImage ? 'Ocultar editor' : 'Editar imagen'}</span>
              </button>
            )}
          </div>

          {editingImage && onUpdateImage && (
            <form
              onSubmit={handleApplyImageUrl}
              className="p-3 rounded-lg border border-[#8e6a3a]/40 bg-white/60 dark:bg-black/30 space-y-2"
            >
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-[#3d2914] dark:text-amber-200">
                  Pega el enlace público de una imagen (JPG, PNG, WebP)
                </span>
                <input
                  type="url"
                  value={imageDraft}
                  onChange={(e) => setImageDraft(e.target.value)}
                  placeholder="https://.../mi-imagen.jpg"
                  className="w-full px-2.5 py-1.5 rounded-md border border-[#8e6a3a]/45 bg-white/90 dark:bg-black/40 text-xs text-[#2b1c0e] dark:text-amber-50"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleRestoreDefaultImage}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-black/5 dark:bg-white/10 hover:bg-black/10 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>Restaurar</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingImage(false)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-black/5 dark:bg-white/10 hover:bg-black/10 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold text-white bg-[#2e5d3a] hover:bg-[#387147] cursor-pointer"
                  >
                    <Check className="w-3 h-3" aria-hidden="true" />
                    <span>Guardar imagen</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {imageFeedback && (
            <p
              role="status"
              className={`text-[11px] font-medium px-2.5 py-1.5 rounded-md ${
                imageFeedback.type === 'ok'
                  ? 'bg-emerald-700/15 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-700/15 text-rose-900 dark:text-rose-200'
              }`}
            >
              {imageFeedback.text}
            </p>
          )}
        </div>

        {/* 3. Párrafo corto explicativo */}
        <p className="font-story text-sm sm:text-base leading-relaxed text-[#332212] dark:text-amber-50/90">
          {station.modalSummary}
        </p>

        {/* 4. Video opcional (sólo si existe; cero espacio vacío si no) */}
        {hasVideo && (
          <div className="rounded-lg overflow-hidden border border-[#8e6a3a]/35 bg-black">
            {videoInfo.kind === 'youtube' || videoInfo.kind === 'vimeo' ? (
              <div className="aspect-video w-full">
                <iframe
                  src={videoInfo.src}
                  title={`Video de ${station.modalTitle}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : videoInfo.kind === 'direct' ? (
              <video
                src={videoInfo.src}
                controls
                className="w-full aspect-video bg-black"
              />
            ) : (
              <a
                href={videoInfo.src}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3.5 py-2.5 text-xs font-medium text-amber-200 hover:bg-white/5"
              >
                <span>Abrir video en nueva pestaña</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            )}
          </div>
        )}

        {/* 5. Botón para cerrar y continuar */}
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg font-display text-xs sm:text-sm font-bold tracking-wide text-[#fff8e8] bg-[#2e5d3a] hover:bg-[#387147] border border-[#7ea966]/60 shadow-md transition-colors cursor-pointer whitespace-nowrap"
          >
            Cerrar y continuar
          </button>
        </div>
      </div>
    </aside>
  );
};
