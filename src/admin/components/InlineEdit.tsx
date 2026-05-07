import { useEffect, useRef, useState } from 'react';

type Props = {
  value: string;
  onSave: (next: string) => void | Promise<void>;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  minLength?: number;
};

export default function InlineEdit({ value, onSave, className = '', inputClassName = '', placeholder, minLength = 1 }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = async () => {
    const trimmed = draft.trim();
    if (trimmed.length < minLength || trimmed === value) {
      setDraft(value);
      setEditing(false);
      return;
    }
    await onSave(trimmed);
    setEditing(false);
  };

  return editing ? (
    <input
      ref={inputRef}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { setDraft(value); setEditing(false); }
      }}
      placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
      className={`bg-white/[0.06] border border-primary-500/40 outline-none rounded px-1.5 py-0.5 text-sm text-white w-full ${inputClassName}`}
    />
  ) : (
    <span
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title="Двойной клик — редактировать"
      className={`cursor-text ${className}`}
    >
      {value}
    </span>
  );
}
