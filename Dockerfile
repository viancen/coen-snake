FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js ./
COPY public ./public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Persist SQLite DB in /data when using volume
ENV SQLITE_DB_PATH=/data/scores.db

CMD ["node", "server.js"]
