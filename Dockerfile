FROM node:20

WORKDIR /usr/src/chatters-server

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src
RUN npm run build
RUN rm -r ./src

EXPOSE 8080
CMD [ "npm", "run", "start" ]