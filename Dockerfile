FROM node:10

WORKDIR  /usr/src/app

RUN npm i install pm2 -g  && npm i install pm2 -g

COPY package*.json ./

COPY ecosystem.config.js ./

RUN npm install

COPY ./dist .

EXPOSE 3006
CMD ["pm2-docker", "ecosystem.config.js"]
