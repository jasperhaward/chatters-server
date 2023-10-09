FROM node:20

WORKDIR /app

COPY package*.json .
COPY tsconfig.json .
COPY src/ src

RUN npm ci
RUN npm run build
RUN rm -r src
RUN npm prune --omit=dev

CMD [ "npm", "run", "start" ]