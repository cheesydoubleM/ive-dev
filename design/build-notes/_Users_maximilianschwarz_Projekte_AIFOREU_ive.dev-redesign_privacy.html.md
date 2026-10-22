# privacy.html: request for a shared file (site.css)

## 1. Add one rule to site.css, section 14 (legal pages)

```css
.legal-head h1 { -webkit-hyphens: auto; hyphens: auto; overflow-wrap: break-word; }
```

Why: the privacy H1 "Datenschutzerklärung" is a single word. At the phone size (40px) it is 442px wide in a 350px column (390 viewport) or 280px (320 viewport). Under iPhone device emulation the layout viewport grows to 462px, the fixed header stretches with it and the Menu button sits off-screen at x 406 to 442 (a tap on it hits "Install IVE"). A narrow desktop window does not show this; device emulation does. With `lang="de"` the rule breaks the heading as "Datenschutz-/erklärung"; `overflow-wrap` is the fallback where hyphenation is not available. Desktop is unaffected (the word fits at 56px). imprint.html does not need it (its 390 viewport stays 390), but the rule is harmless there.

## 2. Local workaround now in privacy.html (remove once 1 is in site.css)

- `<style>.legal-head h1{-webkit-hyphens:auto;hyphens:auto;overflow-wrap:break-word}</style>` after the site.css link
- CSP `style-src 'self' 'sha256-1oDWialt8FkTzVu1USemKowxSax2L3EdsY8yhC72LCk='` (the hash of exactly that rule)

When site.css carries the rule, delete that `<style>` line and set the CSP back to `style-src 'self'`. Nothing else on the page depends on it.

## 3. Footnote (not changed)

footer.html is copied verbatim as USAGE says, so the two screen-reader strings " (opens in a new tab)" are English on this `lang="de"` page. If wanted: a German variant (" (öffnet in neuem Tab)") for privacy only, or `lang="en"` on those spans in footer.html.
