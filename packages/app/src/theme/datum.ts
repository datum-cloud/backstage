import {
  createBaseThemeOptions,
  createUnifiedTheme,
  genPageTheme,
  palettes,
  shapes,
  UnifiedTheme,
} from '@backstage/theme';

const brand = {
  midnightFjord: '#0C1D31',
  midnightFjordHover: '#16263a',
  midnightFjordPaperDark: '#16263a',
  auroraMoss: '#E6F59F',
  pineForge: '#4D6356',
  canyonClay: '#BF9595',
  blushQuartz: '#ECD0D0',
  glacierMist: '#E8E7E4',
  surface: '#F6F6F5',
  navText: '#b8c2cc',
};

const status = {
  success: '#2BAC76',
  warning: '#FFAF36',
  error: '#E95858',
  info: '#0070F3',
};

const bodyFontFamily =
  "'Alliance No.1', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
const headingFontFamily =
  "'Canela Text', Georgia, 'Times New Roman', serif";

const headingTypography = {
  htmlFontSize: 16,
  fontFamily: bodyFontFamily,
  h1: { fontFamily: headingFontFamily, fontSize: 54, fontWeight: 600, marginBottom: 10 },
  h2: { fontFamily: headingFontFamily, fontSize: 40, fontWeight: 600, marginBottom: 8 },
  h3: { fontFamily: headingFontFamily, fontSize: 32, fontWeight: 600, marginBottom: 6 },
  h4: { fontFamily: headingFontFamily, fontSize: 28, fontWeight: 600, marginBottom: 6 },
  h5: { fontFamily: headingFontFamily, fontSize: 24, fontWeight: 600, marginBottom: 4 },
  h6: { fontFamily: headingFontFamily, fontSize: 20, fontWeight: 600, marginBottom: 2 },
};

const flatPage = (color: string, fontColor = '#FFFFFF') =>
  genPageTheme({ colors: [color], shape: shapes.wave, options: { fontColor } });

const datumPageThemes = {
  home: flatPage(brand.midnightFjord),
  documentation: flatPage(brand.midnightFjord),
  tool: flatPage(brand.midnightFjord),
  service: flatPage(brand.midnightFjord),
  website: flatPage(brand.midnightFjord),
  library: flatPage(brand.midnightFjord),
  other: flatPage(brand.midnightFjord),
  app: flatPage(brand.midnightFjord),
  apis: flatPage(brand.midnightFjord),
  card: flatPage(brand.midnightFjord),
};

export const datumLightTheme: UnifiedTheme = createUnifiedTheme({
  ...createBaseThemeOptions({
    palette: {
      ...palettes.light,
      primary: { main: brand.midnightFjord },
      secondary: { main: brand.pineForge },
      error: { main: status.error },
      warning: { main: status.warning },
      success: { main: status.success },
      info: { main: status.info },
      background: {
        default: brand.surface,
        paper: '#FFFFFF',
      },
      status: {
        ...palettes.light.status,
        ok: status.success,
        warning: status.warning,
        error: status.error,
        running: status.info,
      },
      navigation: {
        background: brand.midnightFjord,
        indicator: brand.auroraMoss,
        color: brand.navText,
        selectedColor: '#FFFFFF',
        navItem: { hoverBackground: brand.midnightFjordHover },
        submenu: { background: '#0a2540' },
      },
      tabbar: { indicator: brand.auroraMoss },
    },
    defaultPageTheme: 'home',
    pageTheme: datumPageThemes,
    typography: headingTypography,
  }),
});

export const datumDarkTheme: UnifiedTheme = createUnifiedTheme({
  ...createBaseThemeOptions({
    palette: {
      ...palettes.dark,
      primary: { main: '#9DB8D6', dark: '#7F9FC4' },
      secondary: { main: brand.auroraMoss },
      error: { main: status.error },
      warning: { main: status.warning },
      success: { main: status.success },
      info: { main: status.info },
      background: {
        default: brand.midnightFjord,
        paper: brand.midnightFjordPaperDark,
      },
      status: {
        ...palettes.dark.status,
        ok: status.success,
        warning: status.warning,
        error: status.error,
        running: status.info,
      },
      navigation: {
        background: '#081421',
        indicator: brand.auroraMoss,
        color: brand.navText,
        selectedColor: '#FFFFFF',
        navItem: { hoverBackground: brand.midnightFjordHover },
        submenu: { background: '#0a2540' },
      },
      tabbar: { indicator: brand.auroraMoss },
    },
    defaultPageTheme: 'home',
    pageTheme: datumPageThemes,
    typography: headingTypography,
  }),
});
