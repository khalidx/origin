FROM node:12-alpine

WORKDIR /app

ADD package.json .
ADD package-lock.json .
ADD tsconfig.json .
RUN npm ci

ADD src/ src/
RUN npm run build:node
RUN rm -rf node_modules/
RUN npm ci --only=production
RUN chmod +x dist/server.js

EXPOSE 3000

ENTRYPOINT ["dist/server.js"]
