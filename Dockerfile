FROM node 

WORKDIR /app 

RUN yarn global add nodemon

COPY package.json yarn.lock ./

RUN yarn

COPY ./src ./

CMD [ "yarn", "dev" ]