import { useTranslation } from "react-i18next";

const StudioFooter = () => {
  const { t } = useTranslation();
  return (
    <footer className="w-full py-8 text-center text-sm font-medium text-on-surface-variant bg-surface-bright">
      {t("common.copyright")}
    </footer>
  );
};

export default StudioFooter;
