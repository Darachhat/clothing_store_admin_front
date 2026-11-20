export type FontSizeOption = '13px' | '14px' | '15px' | '16px'

const STORAGE_KEY = 'admin-font-scale'
const DEFAULT_SIZE: FontSizeOption = '14px'

export const FONT_SIZE_OPTIONS: Array<{ value: FontSizeOption; label: string; short: string }> = [
  { value: '13px', label: 'Compact (13px)', short: '13px' },
  { value: '14px', label: 'Default (14px)', short: '14px' },
  { value: '15px', label: 'Comfortable (15px)', short: '15px' },
  { value: '16px', label: 'Large (16px)', short: '16px' },
]

export function useFontSize() {
  const fontSize = useState<FontSizeOption>('admin_font_size', () => DEFAULT_SIZE)

  function applyToDom(size: FontSizeOption) {
    if (!import.meta.client) return
    document.documentElement.style.setProperty('--app-fontsize', size)
    document.documentElement.style.fontSize = size
  }

  function setFontSize(size: FontSizeOption) {
    fontSize.value = size
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, size)
      applyToDom(size)
    }
  }

  function initFontSize() {
    if (!import.meta.client) return
    const saved = localStorage.getItem(STORAGE_KEY) as FontSizeOption | null
    const valid = FONT_SIZE_OPTIONS.some(o => o.value === saved)
    const resolved: FontSizeOption = valid && saved ? saved : DEFAULT_SIZE
    fontSize.value = resolved
    applyToDom(resolved)
  }

  return {
    fontSize,
    options: FONT_SIZE_OPTIONS,
    setFontSize,
    initFontSize,
  }
}
