export type GlowType = 'default' | 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange';

interface GlowStyles {
  header: string;
  content: string;
  cardShadow: string;
  cardGradient: string;
}

export const getGlowStyles = (glowType: GlowType = 'default'): GlowStyles => {
  const styles: Record<GlowType, GlowStyles> = {
    default: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(2,6,23,0.08)] hover:shadow-[0_12px_36px_rgba(2,6,23,0.15)]",
      cardGradient: ""
    },
    red: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(239,68,68,0.25)] hover:shadow-[0_12px_40px_rgba(239,68,68,0.5)]",
      cardGradient: "hover:bg-gradient-to-br hover:from-red-200 hover:via-red-100 hover:to-red-50 dark:hover:from-red-950/60 dark:hover:via-red-900/40 dark:hover:to-red-800/20"
    },
    green: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(34,197,94,0.25)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.5)]",
      cardGradient: "hover:bg-gradient-to-br hover:from-green-200 hover:via-green-100 hover:to-green-50 dark:hover:from-green-950/60 dark:hover:via-green-900/40 dark:hover:to-green-800/20"
    },
    blue: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(59,130,246,0.25)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.5)]",
      cardGradient: "hover:bg-gradient-to-br hover:from-blue-200 hover:via-blue-100 hover:to-blue-50 dark:hover:from-blue-950/60 dark:hover:via-blue-900/40 dark:hover:to-blue-800/20"
    },
    yellow: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(234,179,8,0.25)] hover:shadow-[0_12px_40px_rgba(234,179,8,0.5)]",
      cardGradient: "hover:bg-gradient-to-br hover:from-yellow-200 hover:via-yellow-100 hover:to-yellow-50 dark:hover:from-yellow-950/60 dark:hover:via-yellow-900/40 dark:hover:to-yellow-800/20"
    },
    purple: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(168,85,247,0.25)] hover:shadow-[0_12px_40px_rgba(168,85,247,0.5)]",
      cardGradient: "hover:bg-gradient-to-br hover:from-purple-200 hover:via-purple-100 hover:to-purple-50 dark:hover:from-purple-950/60 dark:hover:via-purple-900/40 dark:hover:to-purple-800/20"
    },
    orange: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(249,115,22,0.25)] hover:shadow-[0_12px_40px_rgba(249,115,22,0.5)]",
      cardGradient: "hover:bg-gradient-to-br hover:from-orange-200 hover:via-orange-100 hover:to-orange-50 dark:hover:from-orange-950/60 dark:hover:via-orange-900/40 dark:hover:to-orange-800/20"
    }
  };

  return styles[glowType] || styles.default;
};

import i18next from 'i18next';

export const getGlowTypeLabel = (type: GlowType): string => {
  const labels: Record<GlowType, string> = {
    default: i18next.t('column.glowDefault'),
    red: i18next.t('column.glowRed'),
    green: i18next.t('column.glowGreen'),
    blue: i18next.t('column.glowBlue'),
    yellow: i18next.t('column.glowYellow'),
    purple: i18next.t('column.glowPurple'),
    orange: i18next.t('column.glowOrange'),
  };
  return labels[type];
};
