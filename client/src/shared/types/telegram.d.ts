interface TelegramWebApp {
  colorScheme: "light" | "dark";
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  onEvent: (event: string, callback: () => void) => void;
  offEvent: (event: string, callback: () => void) => void;
  ready: () => void;
  close: () => void;
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
