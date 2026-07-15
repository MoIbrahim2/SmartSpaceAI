import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const StudioFooter = () => {
  const { t } = useTranslation();
  return (
    <footer className="w-full py-8 text-center text-sm font-medium text-on-surface-variant bg-surface-bright flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
      <span>{t("common.copyright")}</span>
      <span className="hidden md:inline text-outline/30">|</span>
      <Link to="/contact" className="hover:text-primary transition-colors font-semibold">
        {t("common.contactUs")}
      </Link>
    </footer>
  );
};

export default StudioFooter;
