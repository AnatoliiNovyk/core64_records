FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/src ./src
COPY index.html admin.html app.js admin.js data-adapter.js style.css ./public/
COPY images ./public/images

EXPOSE 3000

CMD ["npm", "start"]
