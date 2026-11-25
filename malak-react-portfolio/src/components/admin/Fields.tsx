import { cloneElement, isValidElement, useId, useRef, useState, type ReactNode } from 'react';
import { ImagePlus, LoaderCircle, Upload } from 'lucide-react';
import { uploadImage } from '../../lib/api';
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Gambar belum dapat diunggah.';

export function Field({
  label,
  children,
  hint,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  wide?: boolean;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const native =
    isValidElement<{ id?: string; 'aria-describedby'?: string }>(children) &&
    typeof children.type === 'string' &&
    ['input', 'textarea', 'select'].includes(children.type);
  const input = native
    ? cloneElement(children, { id, 'aria-describedby': hint ? hintId : undefined })
    : children;
  return (
    <div className={`admin-field ${wide ? 'wide' : ''}`}>
      <label htmlFor={native ? id : undefined}>
        <span>{label}</span>
        {!native && input}
      </label>
      {native && input}
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  );
}

export function ImageField({
  value,
  onChange,
  label = 'Gambar',
  onError,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  onError: (value: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const change = useRef(onChange);
  change.current = onChange;
  return (
    <div className="admin-image-field">
      <div className="admin-image-preview">
        {value ? <img src={value} alt={`${label} preview`} /> : <ImagePlus size={30} />}
      </div>
      <div>
        <strong>{label}</strong>
        <p>
          JPG, PNG, WebP, atau AVIF. Maksimal 5 MB.
          <br />
          Gambar otomatis dioptimalkan ke WebP.
        </p>
        <button
          className="button secondary small"
          type="button"
          disabled={uploading}
          onClick={() => input.current?.click()}
        >
          {uploading ? <LoaderCircle className="spin" size={15} /> : <Upload size={15} />}{' '}
          {uploading ? 'Mengunggah...' : 'Unggah gambar'}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="file-input"
          aria-label={`Unggah ${label.toLowerCase()}`}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
              onError('Ukuran gambar maksimal 5 MB.');
              event.target.value = '';
              return;
            }
            setUploading(true);
            try {
              change.current(await uploadImage(file));
            } catch (error) {
              onError(errorText(error));
            } finally {
              setUploading(false);
              if (input.current) input.current.value = '';
            }
          }}
        />
      </div>
    </div>
  );
}
