# Datum theme

`datum.ts` defines the Datum-branded light and dark Backstage themes
(`createUnifiedTheme`). They are registered as theme extensions in
`../modules/theme`, replacing the built-in Backstage themes (the built-ins are
disabled in `app-config.yaml`).

## Fonts (decided: fallback fonts)

The brand typefaces are **commercial, self-hosted** fonts:

- Headings: `Canela Text` (serif)
- Body / UI: `Alliance No.1` (sans)

**Decision: we use fallback fonts.** The licensed brand fonts are intentionally
not bundled (this is a public repo). The theme lists the brand font-family names
first for forward-compatibility, but they simply fall through to clean fallbacks
(`Georgia`/`Times New Roman` serif for headings, a system sans for body), so the
UI looks good as-is. No license follow-up is required.

They can **optionally** be added out-of-band later (private asset bundle or a
licensed CDN) by declaring them via `@font-face`, e.g. in a stylesheet loaded
from `packages/app/public/index.html`:

```css
/* DO NOT commit the .woff2 files to this public repo.
@font-face {
  font-family: 'Alliance No.1';
  src: url('/fonts/AllianceNo1-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Canela Text';
  src: url('/fonts/CanelaText-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
*/
```
