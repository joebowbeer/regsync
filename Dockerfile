FROM node:16

# Create app directory
WORKDIR /usr/src/regsync

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm ci --only=production
# If you are building your code for development
# RUN npm install

# Bundle app source
COPY . .

# install the package from sources
RUN npm install -g .