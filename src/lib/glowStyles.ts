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
      cardGradient: "bg-gradient-to-br from-red-50/80 via-white/50 to-red-100/60 dark:from-red-950/20 dark:via-card/50 dark:to-red-900/30"
    },
    green: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(34,197,94,0.25)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.5)]",
      cardGradient: "bg-gradient-to-br from-green-50/80 via-white/50 to-green-100/60 dark:from-green-950/20 dark:via-card/50 dark:to-green-900/30"
    },
    blue: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(59,130,246,0.25)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.5)]",
      cardGradient: "bg-gradient-to-br from-blue-50/80 via-white/50 to-blue-100/60 dark:from-blue-950/20 dark:via-card/50 dark:to-blue-900/30"
    },
    yellow: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(234,179,8,0.25)] hover:shadow-[0_12px_40px_rgba(234,179,8,0.5)]",
      cardGradient: "bg-gradient-to-br from-yellow-50/80 via-white/50 to-yellow-100/60 dark:from-yellow-950/20 dark:via-card/50 dark:to-yellow-900/30"
    },
    purple: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(168,85,247,0.25)] hover:shadow-[0_12px_40px_rgba(168,85,247,0.5)]",
      cardGradient: "bg-gradient-to-br from-purple-50/80 via-white/50 to-purple-100/60 dark:from-purple-950/20 dark:via-card/50 dark:to-purple-900/30"
    },
    orange: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(249,115,22,0.25)] hover:shadow-[0_12px_40px_rgba(249,115,22,0.5)]",
      cardGradient: "bg-gradient-to-br from-orange-50/80 via-white/50 to-orange-100/60 dark:from-orange-950/20 dark:via-card/50 dark:to-orange-900/30"
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
