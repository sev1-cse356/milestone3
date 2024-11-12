FROM node:20

WORKDIR /app 

RUN yarn global add nodemon

COPY package.json yarn.lock ./

RUN yarn

RUN yarn add compute-cosine-similarity

COPY ./src ./

CMD [ "yarn", "dev" ]