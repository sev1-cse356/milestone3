FROM node:20

WORKDIR /app 

# RUN yarn global add nodemon

COPY package.json yarn.lock ./

RUN yarn

COPY ./src ./

CMD [ "yarn", "start" ]