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
      cardGradient: "bg-gradient-to-br from-red-100 via-red-50 to-white dark:from-red-950/40 dark:via-red-900/20 dark:to-card"
    },
    green: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(34,197,94,0.25)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.5)]",
      cardGradient: "bg-gradient-to-br from-green-100 via-green-50 to-white dark:from-green-950/40 dark:via-green-900/20 dark:to-card"
    },
    blue: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(59,130,246,0.25)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.5)]",
      cardGradient: "bg-gradient-to-br from-blue-100 via-blue-50 to-white dark:from-blue-950/40 dark:via-blue-900/20 dark:to-card"
    },
    yellow: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(234,179,8,0.25)] hover:shadow-[0_12px_40px_rgba(234,179,8,0.5)]",
      cardGradient: "bg-gradient-to-br from-yellow-100 via-yellow-50 to-white dark:from-yellow-950/40 dark:via-yellow-900/20 dark:to-card"
    },
    purple: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(168,85,247,0.25)] hover:shadow-[0_12px_40px_rgba(168,85,247,0.5)]",
      cardGradient: "bg-gradient-to-br from-purple-100 via-purple-50 to-white dark:from-purple-950/40 dark:via-purple-900/20 dark:to-card"
    },
    orange: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(249,115,22,0.25)] hover:shadow-[0_12px_40px_rgba(249,115,22,0.5)]",
      cardGradient: "bg-gradient-to-br from-orange-100 via-orange-50 to-white dark:from-orange-950/40 dark:via-orange-900/20 dark:to-card"
    }
  };

  return styles[glowType] || styles.default;
};

export const glowTypeLabels: Record<GlowType, string> = {
  default: 'Standaard',
  red: 'Rood',
  green: 'Groen',
  blue: 'Blauw',
  yellow: 'Geel',
  purple: 'Paars',
  orange: 'Oranje'
};
