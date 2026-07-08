/**
 * Centralized env/config module — the `@config` import (mirrors the repo's
 * `config/index.ts`: read env once, export named constants in a block).
 *
 * Vite injects values from `.env`, then `.env.development` (dev) or
 * `.env.production` (build). Only `VITE_`-prefixed vars reach the client.
 */

// ** API **
const API_URL = import.meta.env.VITE_API_BASE_URL;
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 15000);

// ** App **
const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'App';

// ** Environment (production vs development conditions) **
const APP_ENV = import.meta.env.MODE; // 'development' | 'production'
const IS_DEV = import.meta.env.DEV;
const IS_PROD = import.meta.env.PROD;

if (!API_URL) {
  throw new Error('[config] Missing required env var: VITE_API_BASE_URL');
}

export { API_URL, API_TIMEOUT, APP_NAME, APP_ENV, IS_DEV, IS_PROD };
