# Single-service build for Zeabur (or any Docker host): build the React
# frontend, then run the Express backend which serves that frontend + the API
# from one origin. The browser only ever talks to this one Hong Kong host.

# ---------- Stage 1: build the React frontend ----------
FROM node:22-slim AS client
WORKDIR /client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
# Same-origin in production -> empty base means the app uses relative "/api".
ENV VITE_API_BASE_URL=""
RUN npm run build

# ---------- Stage 2: backend that also serves the frontend ----------
FROM node:22-slim
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev
COPY server/ ./
# Bring in the built frontend and serve it from the backend.
COPY --from=client /client/dist ./public
ENV NODE_ENV=production
ENV PORT=8080
ENV CLIENT_DIST=/app/public
EXPOSE 8080
CMD ["node", "index.js"]
