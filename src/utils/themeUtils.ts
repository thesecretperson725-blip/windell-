import { ColorTheme } from '../types/attendance';

export interface ThemeConfig {
  id: ColorTheme;
  name: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  primaryButton: string;
  primaryButtonHover: string;
  accentText: string;
  accentBorder: string;
  headerGradient: string;
  glow: string;
  previewBg: string;
}

export const THEME_CONFIGS: Record<ColorTheme, ThemeConfig> = {
  indigo: {
    id: 'indigo',
    name: 'Tech Indigo (Default)',
    badgeBg: 'bg-indigo-500/20',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-300',
    primaryButton: 'bg-indigo-600',
    primaryButtonHover: 'hover:bg-indigo-500',
    accentText: 'text-indigo-400',
    accentBorder: 'border-indigo-500',
    headerGradient: 'from-indigo-600 via-purple-600 to-pink-500',
    glow: 'shadow-indigo-500/25',
    previewBg: 'bg-indigo-600',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Mint',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-300',
    primaryButton: 'bg-emerald-600',
    primaryButtonHover: 'hover:bg-emerald-500',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500',
    headerGradient: 'from-emerald-600 via-teal-600 to-cyan-500',
    glow: 'shadow-emerald-500/25',
    previewBg: 'bg-emerald-600',
  },
  cyan: {
    id: 'cyan',
    name: 'Electric Cyan',
    badgeBg: 'bg-cyan-500/20',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-300',
    primaryButton: 'bg-cyan-600',
    primaryButtonHover: 'hover:bg-cyan-500',
    accentText: 'text-cyan-400',
    accentBorder: 'border-cyan-500',
    headerGradient: 'from-cyan-600 via-blue-600 to-indigo-500',
    glow: 'shadow-cyan-500/25',
    previewBg: 'bg-cyan-600',
  },
  purple: {
    id: 'purple',
    name: 'Royal Violet',
    badgeBg: 'bg-purple-500/20',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-300',
    primaryButton: 'bg-purple-600',
    primaryButtonHover: 'hover:bg-purple-500',
    accentText: 'text-purple-400',
    accentBorder: 'border-purple-500',
    headerGradient: 'from-purple-600 via-fuchsia-600 to-pink-500',
    glow: 'shadow-purple-500/25',
    previewBg: 'bg-purple-600',
  },
  amber: {
    id: 'amber',
    name: 'Gold Amber',
    badgeBg: 'bg-amber-500/20',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-300',
    primaryButton: 'bg-amber-600',
    primaryButtonHover: 'hover:bg-amber-500',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500',
    headerGradient: 'from-amber-600 via-orange-600 to-red-500',
    glow: 'shadow-amber-500/25',
    previewBg: 'bg-amber-600',
  },
  rose: {
    id: 'rose',
    name: 'Crimson Rose',
    badgeBg: 'bg-rose-500/20',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-300',
    primaryButton: 'bg-rose-600',
    primaryButtonHover: 'hover:bg-rose-500',
    accentText: 'text-rose-400',
    accentBorder: 'border-rose-500',
    headerGradient: 'from-rose-600 via-pink-600 to-orange-500',
    glow: 'shadow-rose-500/25',
    previewBg: 'bg-rose-600',
  },
  slate: {
    id: 'slate',
    name: 'Monochrome Slate',
    badgeBg: 'bg-slate-700/50',
    badgeBorder: 'border-slate-600',
    badgeText: 'text-slate-200',
    primaryButton: 'bg-slate-700',
    primaryButtonHover: 'hover:bg-slate-600',
    accentText: 'text-slate-300',
    accentBorder: 'border-slate-500',
    headerGradient: 'from-slate-700 via-slate-600 to-zinc-500',
    glow: 'shadow-slate-500/25',
    previewBg: 'bg-slate-700',
  },
};

export const getThemeConfig = (theme?: ColorTheme): ThemeConfig => {
  if (!theme || !THEME_CONFIGS[theme]) {
    return THEME_CONFIGS.indigo;
  }
  return THEME_CONFIGS[theme];
};
