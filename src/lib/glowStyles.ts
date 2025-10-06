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
      cardGradient: "hover:bg-gradient-to-br hover:from-red-100 hover:via-red-50 hover:to-white dark:hover:from-red-950/40 dark:hover:via-red-900/20 dark:hover:to-card"
    },
    green: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(34,197,94,0.25)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.5)]",
      cardGradient: "hover:bg-gradient-to-br hover:from-green-100 hover:via-green-50 hover:to-white dark:hover:from-green-950/40 dark:hover:via-green-900/20 dark:hover:to-card"
    },
    blue: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(59,130,246,0.25)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.5)]",
      cardGradient: "hover:bg-gradient-to-br hover:from-blue-100 hover:via-blue-50 hover:to-white dark:hover:from-blue-950/40 dark:hover:via-blue-900/20 dark:hover:to-card"
    },
    yellow: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(234,179,8,0.25)] hover:shadow-[0_12px_40px_rgba(234,179,8,0.5)]",
      cardGradient: "hover:bg-gradient-to-br hover:from-yellow-100 hover:via-yellow-50 hover:to-white dark:hover:from-yellow-950/40 dark:hover:via-yellow-900/20 dark:hover:to-card"
    },
    purple: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(168,85,247,0.25)] hover:shadow-[0_12px_40px_rgba(168,85,247,0.5)]",
      cardGradient: "hover:bg-gradient-to-br hover:from-purple-100 hover:via-purple-50 hover:to-white dark:hover:from-purple-950/40 dark:hover:via-purple-900/20 dark:hover:to-card"
    },
    orange: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_8px_24px_rgba(249,115,22,0.25)] hover:shadow-[0_12px_40px_rgba(249,115,22,0.5)]",
      cardGradient: "hover:bg-gradient-to-br hover:from-orange-100 hover:via-orange-50 hover:to-white dark:hover:from-orange-950/40 dark:hover:via-orange-900/20 dark:hover:to-card"
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
