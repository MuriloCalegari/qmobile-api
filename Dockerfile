FROM node:8-alpine

USER root

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

WORKDIR /opt/app
COPY . .

RUN apk add --no-cache vips-dev make gcc g++ python && \
  npm install && \
  apk del make gcc g++ python vips-dev
RUN npm run build
RUN npm prune --production

EXPOSE 80
VOLUME [ "/opt/app/data" ]

CMD [ "npm", "start" ]
