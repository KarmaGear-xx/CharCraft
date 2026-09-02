import { useEffect, useState } from 'react';
import { useCardStore } from '../store/store';
import { useT } from '../i18n';
import type { DecodedImage } from '../../shared/types';

function rgbaToDataUrl(img: DecodedImage): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(img.width, img.height);
  imageData.data.set(img.rgba);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export default function AvatarSection() {
  const t = useT();
  const image = useCardStore((s) => s.image);
  const cropAvatar = useCardStore((s) => s.cropAvatar);
  const resizeAvatar = useCardStore((s) => s.resizeAvatar);
  const pickAvatar = useCardStore((s) => s.pickAvatar);
  const setError = useCardStore((s) => s.setError);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    setDataUrl(image ? rgbaToDataUrl(image) : null);
  }, [image]);

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section className="panel">
      <div className="section-head">
        <h2>{t('avatar.title')}</h2>
      </div>
      {dataUrl ? (
        <div className="avatar-box">
          <img className="avatar-img" src={dataUrl} alt="avatar" />
        </div>
      ) : (
        <p className="hint">{t('avatar.empty')}</p>
      )}
      <div className="avatar-actions">
        <button className="btn" onClick={() => void run(pickAvatar)}>
          {t('avatar.choose')}
        </button>
        <button className="btn" disabled={!image} onClick={cropAvatar}>
          {t('avatar.crop')}
        </button>
        <button className="btn" disabled={!image} onClick={() => resizeAvatar(512)}>
          {t('avatar.resize')}
        </button>
      </div>
    </section>
  );
}
