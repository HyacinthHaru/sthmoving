import type { UserTheme } from '../types/domain'

const THEME_STORAGE_KEY = 'yuna-user-theme'

export interface ThemeOption {
  key: UserTheme
  label: string
  color: string
  softColor: string
}

export const themeOptions: readonly ThemeOption[] = [
  { key: 'NAVY', label: '藏青', color: '#17365d', softColor: '#e8eef6' },
  { key: 'INDIGO', label: '靛蓝', color: '#3730a3', softColor: '#e0e7ff' },
  { key: 'BLUE', label: '湛蓝', color: '#0068b5', softColor: '#dbeafe' },
  { key: 'TEAL', label: '深青', color: '#007983', softColor: '#d9f3f0' },
  { key: 'FOREST', label: '松绿', color: '#006b3c', softColor: '#dcfce7' },
  { key: 'OLIVE', label: '橄榄', color: '#536600', softColor: '#eef3d2' },
  { key: 'RUST', label: '赭橙', color: '#8c4300', softColor: '#ffedd5' },
  { key: 'WINE', label: '朱砂', color: '#a31621', softColor: '#fee2e2' },
  { key: 'ROSE', label: '绛红', color: '#9b174c', softColor: '#fce7f3' },
  { key: 'PURPLE', label: '茄紫', color: '#72147e', softColor: '#f3e8ff' },
  { key: 'SLATE', label: '雾灰', color: '#6b7280', softColor: '#f1f5f9' },
  { key: 'COFFEE', label: '咖褐', color: '#3e2723', softColor: '#f3e8df' },
]

export function getStoredTheme(): UserTheme {
  const stored = wx.getStorageSync<UserTheme>(THEME_STORAGE_KEY)
  return themeOptions.some(({ key }) => key === stored) ? stored : 'NAVY'
}

export function storeTheme(theme: UserTheme): void {
  wx.setStorageSync(THEME_STORAGE_KEY, theme)
}

export function getThemeStyle(theme = getStoredTheme()): string {
  const option = getThemeOption(theme)
  return `--brand-color: ${option.color}; --brand-soft-color: ${option.softColor};`
}

export function getPageThemeStyle(theme = getStoredTheme()): string {
  void applyNavigationTheme(theme).catch((error: unknown) => {
    console.error('应用页面主题失败', error)
  })
  return getThemeStyle(theme)
}

export function getThemeColor(theme = getStoredTheme()): string {
  return getThemeOption(theme).color
}

export async function applyNavigationTheme(theme = getStoredTheme()): Promise<void> {
  const color = getThemeColor(theme)
  await wx.setNavigationBarColor({
    frontColor: '#ffffff',
    backgroundColor: color,
  })
}

function getThemeOption(theme: UserTheme): ThemeOption {
  return themeOptions.find(({ key }) => key === theme) ?? themeOptions[0]!
}
