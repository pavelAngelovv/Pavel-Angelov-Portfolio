# Pavel Angelov - Portfolio

Personal portfolio site. Plain HTML, CSS and JS, built with [Vite](https://vite.dev), animated with [GSAP](https://gsap.com) (ScrollTrigger, SplitText, ScrambleText, MotionPath) and [Lenis](https://lenis.darkroom.engineering) smooth scrolling, and hosted on Cloudflare Workers (static assets).

Live: https://pavel-angelov.pavel-portfolio.workers.dev

## Develop

```sh
npm install
npm run dev       # http://localhost:5173
```

## Build and deploy

```sh
npm run build     # outputs to dist/
npm run preview   # serves dist/ locally on the Cloudflare runtime
npm run deploy    # builds and deploys to Cloudflare (needs `npx wrangler login` once)
```

## Structure

- `index.html` - all page content
- `src/main.js` - animations and interactions
- `src/style.css` - styles
- `public/` - files served as-is: the CV PDF, `_headers` (security and cache headers), `robots.txt`
- `wrangler.jsonc` - Cloudflare config
