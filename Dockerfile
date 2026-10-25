# One container for the whole site: the API server also serves the built React client.
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/packages/server/dist packages/server/dist
COPY --from=build /app/packages/client/dist packages/client/dist
COPY --from=build /app/packages/server/package.json packages/server/
# The server bundle keeps pg-native out; everything else is inside dist/index.js.
EXPOSE 4000
CMD ["node", "packages/server/dist/index.js"]
