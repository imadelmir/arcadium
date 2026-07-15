# =============================================================================
# Arcadium — ACE5 · Milestone M6 · Task T6
# Immagine del frontend Next.js per l'ambiente demo (container separato).
#
# Multi-stage con output "standalone" (vedi next.config.mjs):
#   - deps:    installa le dipendenze in cache (npm ci sul solo lock).
#   - build:   `next build` -> genera .next/standalone (server minimale).
#   - runtime: solo Node + il bundle standalone, utente non-root.
#
# ATTENZIONE — NEXT_PUBLIC_API_URL: e' una variabile "public", quindi viene
# INCORPORATA nel bundle a BUILD TIME e usata dal BROWSER dell'utente. Il
# browser raggiunge il backend tramite la PORTA PUBBLICATA sull'host, non
# tramite il nome di rete interno "backend". Per la demo locale il default
# http://localhost:8080 e' corretto; si sovrascrive con --build-arg solo se la
# demo gira su un'altra macchina/indirizzo.
# =============================================================================

# ---- Stage 1: dipendenze ----------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: build ---------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Stage 3: runtime -------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# Utente non-root gia' presente nell'immagine node ("node").
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
