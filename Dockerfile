FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node scripts ./scripts
RUN mkdir -p /app/data /app/outputs && chown -R node:node /app/data /app/outputs
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DB_PATH=/app/data/aidat.sqlite SECURE_COOKIE=true
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "src/server.js"]
