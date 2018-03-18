FROM adimit/docker-node-chromium

USER root

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

WORKDIR /opt/app

COPY . /opt/app

RUN mkdir /opt/app/data

EXPOSE 3002
VOLUME [ "/opt/app/data" ]

CMD [ "npm", "start" ]
