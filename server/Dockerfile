FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --chown=node:node . .

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e " \
    fetch('http://localhost:5000/api/health') \
    .then(res => process.exit(res.ok ? 0 : 1)) \
    .catch(() => process.exit(1)) \
    "

CMD [ "npm", "start" ]
