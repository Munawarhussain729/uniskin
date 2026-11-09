# Site QA screenshots — uniskin.dev

Full-page screenshots of `apps/site` (`vite preview` on the production
build) taken with Playwright (Chromium, deviceScaleFactor 1).

Matrix: adapter (`default` / `shadcn` / `daisyui`) × appearance (light /
dark) × viewport width (1280 / 768 / 360). File names are
`<adapter>-<light|dark>-<width>.png`. State was driven through the
site's own deep-link params (`?adapter=<name>&dark=<0|1>`), so every
shot is reproducible:

```sh
pnpm --filter site build
pnpm --filter site exec vite preview --port 4173
# then screenshot http://localhost:4173/?adapter=<name>&dark=<0|1>
# at viewport widths 1280 / 768 / 360
```

All shots verified: 32 skin iframes (9 demo/specimen + 23 generated component examples) mounted per page, zero page errors,
and `document.documentElement.scrollWidth` equals the viewport width
(no horizontal scroll) at every size.
