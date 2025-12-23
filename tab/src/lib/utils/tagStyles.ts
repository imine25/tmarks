export const TAG_CHIP_BASE_CLASS =
  'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95';

export type TagTheme = 'classic' | 'mono' | 'bw';

export function getSuggestedTagClass(theme: TagTheme, isSelected: boolean, isNew: boolean): string {
  const bwSelected =
    'border border-[color:var(--tab-tag-border)] bg-[color:var(--tab-tag-selected-bg)] text-[var(--tab-tag-selected-text)] hover:opacity-90';
  const bwUnselected =
    'border border-[color:var(--tab-tag-border)] bg-[color:var(--tab-tag-unselected-bg)] text-[var(--tab-tag-unselected-text)] hover:bg-[color:var(--tab-surface-muted)]';

  const neutral =
    'border border-[color:var(--tab-border-strong)] bg-[color:var(--tab-surface)] text-[var(--tab-text)] hover:bg-[color:var(--tab-surface-muted)]';

  const info =
    'border border-[color:var(--tab-message-info-border)] bg-[color:var(--tab-message-info-bg)] text-[var(--tab-message-info-icon)] hover:opacity-90';

  const success =
    'border border-[color:var(--tab-message-success-border)] bg-[color:var(--tab-message-success-bg)] text-[var(--tab-message-success-icon)] hover:opacity-90';

  const warning =
    'border border-[color:var(--tab-message-warning-border)] bg-[color:var(--tab-message-warning-bg)] text-[var(--tab-message-warning-icon)] hover:opacity-90';

  if (theme === 'bw') {
    return isSelected ? bwSelected : bwUnselected;
  }

  if (theme === 'mono') {
    if (isSelected) {
      return isNew ? warning : success;
    }

    return isNew ? info : neutral;
  }

  if (isSelected) {
    return isNew ? warning : success;
  }

  return isNew ? info : neutral;
}

export function getSelectedTagClass(theme: TagTheme): string {
  const base =
    'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all duration-200 active:scale-95';

  if (theme === 'bw') {
    return `${base} border-[color:var(--tab-tag-border)] bg-[color:var(--tab-tag-selected-bg)] text-[var(--tab-tag-selected-text)] hover:opacity-90`;
  }

  if (theme === 'mono') {
    return `${base} border-[color:var(--tab-message-info-border)] bg-[color:var(--tab-message-info-bg)] text-[var(--tab-message-info-icon)] hover:opacity-90`;
  }

  return `${base} border-[color:var(--tab-message-info-border)] bg-[color:var(--tab-surface)] text-[var(--tab-message-info-icon)] shadow-sm hover:bg-[color:var(--tab-surface-muted)]`;
}

export function getExistingTagClass(theme: TagTheme, isSelected: boolean): string {
  const bwSelected =
    'border border-[color:var(--tab-tag-border)] bg-[color:var(--tab-tag-selected-bg)] text-[var(--tab-tag-selected-text)] shadow-sm hover:opacity-90';
  const bwUnselected =
    'border border-[color:var(--tab-tag-border)] bg-[color:var(--tab-tag-unselected-bg)] text-[var(--tab-tag-unselected-text)] hover:bg-[color:var(--tab-surface-muted)]';

  const neutral =
    'border border-[color:var(--tab-border-strong)] bg-[color:var(--tab-surface)] text-[var(--tab-text)] hover:bg-[color:var(--tab-surface-muted)]';

  const selected =
    'border border-[color:var(--tab-message-success-border)] bg-[color:var(--tab-message-success-bg)] text-[var(--tab-message-success-icon)] shadow-sm hover:opacity-90';

  if (theme === 'bw') {
    return isSelected ? bwSelected : bwUnselected;
  }

  if (theme === 'mono') {
    return isSelected ? selected : neutral;
  }

  return isSelected ? selected : neutral;
}
