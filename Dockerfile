FROM node:22

WORKDIR /app

COPY package*.json .
COPY tsconfig.json .
COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

COPY src/ src

RUN npm ci
RUN npm run build
RUN rm -r src
RUN npm prune --omit=dev

ENTRYPOINT [ "bash", "entrypoint.sh" ]