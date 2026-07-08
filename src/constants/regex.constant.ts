/** Shared regular expressions (repo convention — `regex.constant.ts`). */
export const REGEX = Object.freeze({
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
  PHONE: /^\+?[0-9]{7,15}$/,
  URL: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/,
});
