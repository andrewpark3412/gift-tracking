# ---------- Base stage: install deps and copy source ----------
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all source
COPY . .

# ---------- Dev stage: runs Vite dev server ----------
FROM base AS dev
ENV NODE_ENV=development
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# ---------- Build stage: builds static assets ----------
FROM base AS builder
ENV NODE_ENV=production
RUN npm run build

# ---------- Preview/Prod-like stage: serve the built app ----------
FROM node:20-alpine AS preview
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
