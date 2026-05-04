import axios from 'axios';

import { apiConfig } from '@/config/api.config';

/** Trailing slash so relative paths like `dashboard` resolve under the configured REST root. */
const baseURL = `${apiConfig.baseApiUrl.replace(/\/+$/, '')}/`;

export const http = axios.create({
  baseURL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});
