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

  show(message: string, type: ToastType = 'info', duration: number = 4000) {
    if (!message) return;

    // Deduplicate identical error/warning messages within a 2-second window
    const now = Date.now();
    const lastTime = this.recentMessages.get(`${type}:${message}`) || 0;
    if (now - lastTime < 2000) {
      return;
    }
    this.recentMessages.set(`${type}:${message}`, now);

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

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number) {
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
