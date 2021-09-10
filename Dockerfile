# a Node.js application container
FROM node:13.2.0-alpine

# install curl
RUN apk update && apk add \
    curl git \
    make gcc g++ python openssl \
    && rm -rf /var/cache/apk/*

RUN mkdir -p /opt/app
WORKDIR /opt/app


ARG NPM_TOKEN  
COPY .npmrc /opt/app/.npmrc

# copy for faster install
COPY package.json /opt/app/package.json
COPY package-lock.json /opt/app/package-lock.json

ENV NODE_OPTIONS=--max_old_space_size=7680

RUN npm install

# Copy all code
COPY . /opt/app

# install all dev and production dependencies
RUN npm run build:prod 

RUN rm -f .npmrc

# Expose API port to the outside
EXPOSE 3000

CMD ["npm", "start"]
