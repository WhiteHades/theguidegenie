type NumberStyle = "currency" | "decimal" | "percent";

function createFormatter(style: NumberStyle) {
  return (value: number, options: Intl.NumberFormatOptions = {}) => {
    const currency = options.currency || (style === "currency" ? "EUR" : undefined);

    return new Intl.NumberFormat("en", {
      style,
      currency,
      maximumFractionDigits: style === "decimal" ? 0 : undefined,
      ...options,
    }).format(value);
  };
}

export const useTranslations = () => {
  const locale = computed(() => "en");
  const defaultLocale = "en";

  return {
    locale,
    defaultLocale,
    t: (key: string) => key,
    n: createFormatter("decimal"),
    d: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat("en", options).format(new Date(value)),
    currency: createFormatter("currency"),
    percent: createFormatter("percent"),
  };
};
