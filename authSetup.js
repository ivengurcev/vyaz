import { authConfigManager } from '@hono/auth-js/react';
import {AUTH_BASE_URL} from '__config__';

authConfigManager.setConfig({
    basePath: AUTH_BASE_URL
});

export const SIGNIN_ERROR_URL = `${authConfigManager.getConfig().basePath}/error`;