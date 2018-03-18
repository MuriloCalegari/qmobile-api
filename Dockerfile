FROM adimit/docker-node-chromium

USER root

WORKDIR /home/app
RUN mkdir /home/app/data

COPY package*.json ./

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

RUN npm i
COPY . .

EXPOSE 3002 3306
VOLUME [ "/home/app/data" ]

CMD [ "npm", "start" ]
