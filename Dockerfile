FROM node:8-alpine

USER root

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

COPY package*.json /tmp/
RUN cd /tmp && npm install
RUN npm run build
RUN npm prune --production
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

WORKDIR /opt/app

COPY . /opt/app

RUN mkdir /opt/app/data

EXPOSE 80
VOLUME [ "/opt/app/data" ]

CMD [ "npm", "start" ]
