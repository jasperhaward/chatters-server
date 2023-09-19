FROM node:20

WORKDIR /usr/src/chatters-server

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src
RUN npm run build
RUN rm -r ./src
RUN npm prune --omit=dev

EXPOSE 8080
CMD [ "npm", "run", "start" ]