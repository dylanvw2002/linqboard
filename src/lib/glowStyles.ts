export type GlowType = 'default' | 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange';

interface GlowStyles {
  header: string;
  content: string;
  cardShadow: string;
}

export const getGlowStyles = (glowType: GlowType = 'default'): GlowStyles => {
  const styles: Record<GlowType, GlowStyles> = {
    default: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_10px_30px_rgba(2,6,23,0.08)] hover:shadow-[0_15px_40px_rgba(2,6,23,0.12)]"
    },
    red: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_10px_30px_rgba(239,68,68,0.3)] hover:shadow-[0_15px_40px_rgba(239,68,68,0.4)]"
    },
    green: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_10px_30px_rgba(34,197,94,0.3)] hover:shadow-[0_15px_40px_rgba(34,197,94,0.4)]"
    },
    blue: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_10px_30px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.4)]"
    },
    yellow: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_10px_30px_rgba(234,179,8,0.3)] hover:shadow-[0_15px_40px_rgba(234,179,8,0.4)]"
    },
    purple: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_15px_40px_rgba(168,85,247,0.4)]"
    },
    orange: {
      header: "bg-card border-border",
      content: "bg-card/50 border-border",
      cardShadow: "shadow-[0_10px_30px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_40px_rgba(249,115,22,0.4)]"
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
