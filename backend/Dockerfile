FROM node:lts-slim
ENV APP_PATH /usr/app
# COPY . ${APP_PATH}
WORKDIR ${APP_PATH}
COPY ["package.json", "yarn.lock*", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
# add `/usr/src/node_modules/.bin` to $PATH
ENV PATH ${APP_PATH}/node_modules/.bin:$PATH
COPY . .
RUN yarn
EXPOSE 5000
CMD yarn dev



# WORKDIR /usr/src/app
# COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
# RUN npm install --production --silent && mv node_modules ../
# COPY . .
# EXPOSE 5000
# CMD npm start