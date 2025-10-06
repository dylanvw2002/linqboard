export type GlowType = 'default' | 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange';

interface GlowStyles {
  header: string;
  content: string;
}

export const getGlowStyles = (glowType: GlowType = 'default'): GlowStyles => {
  const styles: Record<GlowType, GlowStyles> = {
    default: {
      header: "bg-white/15 dark:bg-card/15 border-white/40 dark:border-white/20",
      content: "bg-card/50 border-border"
    },
    red: {
      header: "bg-red-100 border-red-200",
      content: "bg-red-50/50 border-red-200"
    },
    green: {
      header: "bg-green-100 border-green-200",
      content: "bg-green-50/50 border-green-200"
    },
    blue: {
      header: "bg-blue-100 border-blue-200",
      content: "bg-blue-50/50 border-blue-200"
    },
    yellow: {
      header: "bg-yellow-100 border-yellow-200",
      content: "bg-yellow-50/50 border-yellow-200"
    },
    purple: {
      header: "bg-purple-100 border-purple-200",
      content: "bg-purple-50/50 border-purple-200"
    },
    orange: {
      header: "bg-orange-100 border-orange-200",
      content: "bg-orange-50/50 border-orange-200"
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
