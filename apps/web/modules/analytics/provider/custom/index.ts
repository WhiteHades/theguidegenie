export const useAnalytics = () => {
  const init = () => {
    void process.client;
  };

  const trackEvent = (_event: string, _data?: Record<string, any>) => {};

  return {
    init,
    trackEvent,
  };
};
