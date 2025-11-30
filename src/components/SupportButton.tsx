import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const SupportButton = () => {
  const { t } = useTranslation();

  const handleSupport = () => {
    window.location.href = "mailto:info@linqboard.io?subject=Support Request";
  };

  return (
    <div className="absolute bottom-6 right-6">
      <Button
        onClick={handleSupport}
        size="lg"
        className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
      >
        <MessageCircle className="md:mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
        <span className="hidden md:inline">{t('support.contact')}</span>
      </Button>
    </div>
  );
};

export default SupportButton;
