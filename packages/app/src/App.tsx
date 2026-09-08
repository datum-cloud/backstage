import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { authModule } from './modules/auth';
import { i18nModule } from './modules/i18n';
import { navModule } from './modules/nav';
import { themeModule } from './modules/theme';

export default createApp({
  features: [catalogPlugin, authModule, i18nModule, navModule, themeModule],
});
