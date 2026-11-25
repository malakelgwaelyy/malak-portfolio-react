# Malak Elgwaely — React Portfolio

A React + TypeScript portfolio adapted from the supplied premium portfolio reference and populated with Malak’s profile, portrait, projects, skills, education, and contact details.

## Run locally

```bash
npm install
npm run dev
```

## Build for GitHub Pages

The Vite base path is configured for this repository: `/malak-portfolio/`.

```bash
npm run build
```

Publish the contents of `dist/` using GitHub Pages (GitHub Actions recommended). A `404.html` fallback is generated for project detail routes.

## Customize content

- `shared/content.json` — profile, copy, ID card, skills, education, projects, and links.
- `public/images/` — portrait and project images.
- `public/Malak_Elgwaely_CV.pdf` — downloadable CV.

The contact form opens the visitor’s email application with the message prefilled; no server/API is required.
