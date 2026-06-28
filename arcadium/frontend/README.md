# Arcadium - Frontend

Frontend of **Arcadium**, a Steam-style game library (project BID-ACE5, milestone M5).
Built with **Next.js (App Router)** and **React**.

## Requirements

- Node.js 20+ (LTS)

## Getting started

```bash
npm install      # install dependencies (first time only)
npm run dev      # start the dev server on http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # run the production build
npm run lint     # check the code with ESLint
```

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to your
backend URL when the pages start calling the API.

## Folder structure

```
frontend/
├── public/              static files served as-is
└── src/
    ├── app/             routing (Next.js App Router)
    │   ├── (app)/       pages with the sidebar (panoramica, libreria, ...)
    │   ├── (auth)/      login and registrazione (no sidebar)
    │   ├── layout.js    root layout (loads theme + global styles)
    │   └── page.js      "/" -> redirects to /panoramica
    ├── assets/          images and logo
    ├── components/      reusable UI components            (M5 - T2)
    ├── layouts/         sidebar / header / search bar     (M5 - T4)
    ├── api/             calls to the Spring Boot backend
    ├── context/         auth and language state
    ├── hooks/           custom React hooks
    ├── i18n/            IT/EN translations                (M5 - T3)
    ├── theme/           colours (violet palette), spacing, radius
    └── utils/           helper functions
```

> Note: the original project structure used `src/pages/`. With Next.js the
> routing lives in `src/app/` instead; every other folder is the same.

## Routes

| Path             | Page                          |
| ---------------- | ----------------------------- |
| `/`              | redirects to `/panoramica`    |
| `/panoramica`    | Overview                      |
| `/negozio`       | Store                         |
| `/libreria`      | Library                       |
| `/wishlist`      | Wishlist                      |
| `/backlog`       | Backlog (game states)         |
| `/statistiche`   | Statistics                    |
| `/community`     | Community                     |
| `/impostazioni`  | Settings                      |
| `/login`         | Login                         |
| `/registrazione` | Sign up                       |

## Status

**M5 - T1 done:** project setup, routing skeleton and the violet theme.
The pages are placeholders for now; their real UIs come in the next M5 tasks.
