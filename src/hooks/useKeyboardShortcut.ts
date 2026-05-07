import { useEffect } from 'react';

type Modifier = 'cmd' | 'ctrl' | 'shift' | 'alt' | 'meta';

export type ShortcutSpec = {
  /** lowercased key, e.g. 'k', 'enter', '/', '?' */
  key: string;
  modifiers?: Modifier[];
  /** Allow the shortcut to fire even when focus is in an input/textarea */
  allowInInput?: boolean;
  /** Stop propagation and prevent default */
  preventDefault?: boolean;
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

function matches(e: KeyboardEvent, spec: ShortcutSpec): boolean {
  if (e.key.toLowerCase() !== spec.key.toLowerCase()) return false;
  const mods = spec.modifiers ?? [];
  // 'cmd' === Meta on macOS, Ctrl on others (unified). Use 'meta' for Meta-only, 'ctrl' for Ctrl-only.
  const isCmd = mods.includes('cmd');
  const wantCtrl = mods.includes('ctrl');
  const wantMeta = mods.includes('meta');
  const wantShift = mods.includes('shift');
  const wantAlt = mods.includes('alt');

  if (isCmd) {
    if (!(e.metaKey || e.ctrlKey)) return false;
  } else {
    if (wantCtrl !== e.ctrlKey) return false;
    if (wantMeta !== e.metaKey) return false;
  }
  if (wantShift !== e.shiftKey) return false;
  if (wantAlt !== e.altKey) return false;
  return true;
}

export function useKeyboardShortcut(
  spec: ShortcutSpec,
  handler: (e: KeyboardEvent) => void,
  deps: ReadonlyArray<unknown> = []
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!spec.allowInInput && isTypingTarget(e.target)) return;
      if (!matches(e, spec)) return;
      if (spec.preventDefault !== false) {
        e.preventDefault();
        e.stopPropagation();
      }
      handler(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Vim-style sequence shortcut. e.g. "g d" → press g, then d within 1 second.
 * Fires on the second key only.
 */
export function useSequenceShortcut(
  sequence: [string, string],
  handler: () => void,
  options: { allowInInput?: boolean; timeoutMs?: number } = {},
  deps: ReadonlyArray<unknown> = []
) {
  useEffect(() => {
    const [first, second] = sequence;
    let waiting = false;
    let timer: number | null = null;

    const reset = () => {
      waiting = false;
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (!options.allowInInput && isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return reset();

      const k = e.key.toLowerCase();
      if (waiting) {
        if (k === second.toLowerCase()) {
          e.preventDefault();
          handler();
        }
        reset();
        return;
      }
      if (k === first.toLowerCase()) {
        waiting = true;
        timer = window.setTimeout(reset, options.timeoutMs ?? 1000);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
