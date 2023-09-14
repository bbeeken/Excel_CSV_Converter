FROM keymetrics/pm2:latest-alpine



WORKDIR /EXCEL_CSV_CONVERTER
RUN npm install pm2@latest -g
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .








CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]