FROM node:lts-slim
# ENV NODE_ENV production

WORKDIR /tileserver

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# RUN npm config set unsafe-perm true
# RUN npm install --no-optional && npm cache clean --force
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "node", "server.js" ]