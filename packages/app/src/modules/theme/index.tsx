import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { ThemeBlueprint } from '@backstage/plugin-app-react';
import { UnifiedThemeProvider } from '@backstage/theme';
import LightIcon from '@material-ui/icons/WbSunny';
import DarkIcon from '@material-ui/icons/Brightness2';
import { datumDarkTheme, datumLightTheme } from '../../theme/datum';

const datumLightThemeExtension = ThemeBlueprint.make({
  name: 'datum-light',
  params: {
    theme: {
      id: 'datum-light',
      title: 'Datum Light',
      variant: 'light',
      icon: <LightIcon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={datumLightTheme}>
          {children}
        </UnifiedThemeProvider>
      ),
    },
  },
});

const datumDarkThemeExtension = ThemeBlueprint.make({
  name: 'datum-dark',
  params: {
    theme: {
      id: 'datum-dark',
      title: 'Datum Dark',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={datumDarkTheme}>
          {children}
        </UnifiedThemeProvider>
      ),
    },
  },
});

export const themeModule = createFrontendModule({
  pluginId: 'app',
  extensions: [datumLightThemeExtension, datumDarkThemeExtension],
});
