FROM node:20

WORKDIR /app 

RUN yarn global add nodemon

COPY package.json yarn.lock ./

ENV NODE_ENV=production

RUN yarn

COPY ./src ./

CMD [ "yarn", "start" ]