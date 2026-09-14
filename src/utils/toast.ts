export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();
  private recentMessages: Map<string, number> = new Map();

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  private normalizeMessage(input: unknown): string {
    if (!input) return '';
    if (typeof input === 'string') return input.trim();
    if (Array.isArray(input)) return input.filter(Boolean).map((item) => this.normalizeMessage(item)).join('. ');
    if (typeof input === 'object') {
      const obj = input as any;
      if (typeof obj.message === 'string') return obj.message.trim();
      if (Array.isArray(obj.message)) return obj.message.filter(Boolean).join('. ');
      if (typeof obj.error === 'string') return obj.error.trim();
    }
    return String(input);
  }

  show(rawMessage: unknown, type: ToastType = 'info', duration: number = 4000) {
    const message = this.normalizeMessage(rawMessage);
    if (!message) return;

    // Deduplicate identical error/warning/info messages within a 2-second window
    const normalizedKey = `${type}:${message.toLowerCase()}`;
    const now = Date.now();
    const lastTime = this.recentMessages.get(normalizedKey) || 0;
    if (now - lastTime < 2000) {
      return;
    }
    this.recentMessages.set(normalizedKey, now);

    const id = `${now}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: ToastItem = { id, type, message, duration };

    this.toasts = [...this.toasts, toast];
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(message: unknown, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: unknown, duration?: number) {
    this.show(message, 'error', duration);
  }

  warning(message: unknown, duration?: number) {
    this.show(message, 'warning', duration);
  }

  info(message: unknown, duration?: number) {
    this.show(message, 'info', duration);
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toast = new ToastManager();
