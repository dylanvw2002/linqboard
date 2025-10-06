export type GlowType = 'default' | 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange';

interface GlowStyles {
  header: string;
  content: string;
  card: string;
}

export const getGlowStyles = (glowType: GlowType = 'default'): GlowStyles => {
  const styles: Record<GlowType, GlowStyles> = {
    default: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      card: "bg-card border-border hover:bg-accent/5"
    },
    red: {
      header: "bg-red-100 dark:bg-red-950/50 border-red-200 dark:border-red-900",
      content: "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
      card: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/40 shadow-red-200/50 dark:shadow-red-900/30"
    },
    green: {
      header: "bg-green-100 dark:bg-green-950/50 border-green-200 dark:border-green-900",
      content: "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
      card: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/40 shadow-green-200/50 dark:shadow-green-900/30"
    },
    blue: {
      header: "bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900",
      content: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
      card: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/40 shadow-blue-200/50 dark:shadow-blue-900/30"
    },
    yellow: {
      header: "bg-yellow-100 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-900",
      content: "bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900",
      card: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-950/40 shadow-yellow-200/50 dark:shadow-yellow-900/30"
    },
    purple: {
      header: "bg-purple-100 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900",
      content: "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900",
      card: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/40 shadow-purple-200/50 dark:shadow-purple-900/30"
    },
    orange: {
      header: "bg-orange-100 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900",
      content: "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900",
      card: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/40 shadow-orange-200/50 dark:shadow-orange-900/30"
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
