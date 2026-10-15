# Portofolio — Farid Rizky Fauzan

Personal portfolio website: a single-page React app presenting two parallel tracks — **IT / software** and **Esports / team management** — with a live GitHub snapshot, a certificate vault, and a dark/light theme.

🔗 Live site: <https://zann06.github.io/Portofolio/>

## Tech stack

| Layer     | Choice                                            |
| --------- | ------------------------------------------------- |
| Build     | [Vite 7](https://vite.dev) + TypeScript            |
| UI        | React 19 + Tailwind CSS v4                         |
| Components | shadcn/ui (Radix UI + CVA)                         |
| Animation | Framer Motion                                      |
| Forms     | React Hook Form + Zod                              |
| Charts    | Recharts                                           |
| Icons     | lucide-react                                       |

## Getting started

```bash
npm install
npm run dev      # start dev server
npm run build    # typecheck + production build to dist/
npm run preview  # preview the production build
npm run typecheck
```

Node 20+ is required (Vite 7).

## Project structure

```
public/
  certificates/   certificate scans referenced by src/data/portfolio.ts
  projects/       project cover images
  farid.jpg       portrait used in the hero laptop mockup
  og.png          social preview image
src/
  components/
    portfolio/    page sections (Hero, About, SelectedWorks, CertificateVault, ...)
    ui/           shadcn/ui primitives
  data/
    portfolio.ts  single source of truth for all content
  lib/utils.ts    `cn()` helper
```

All copy, projects, experience, skills, and certificates live in
[`src/data/portfolio.ts`](src/data/portfolio.ts) — edit that file to update the
site; no component changes needed.

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds with `VITE_BASE=/Portofolio/` and publishes to GitHub Pages.

To enable it once: **Settings → Pages → Source: GitHub Actions**. After that,
every push to `main` redeploys automatically.

Deploying elsewhere (Vercel, Netlify, Cloudflare)? Leave `VITE_BASE` unset — it
defaults to `/` and works as-is.

## License

© Farid Rizky Fauzan. Personal project — all rights reserved.
