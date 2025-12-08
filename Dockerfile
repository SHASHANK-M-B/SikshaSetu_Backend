# Use the standard Node.js 18 image (includes build tools for bcrypt/sharp)
FROM node:18

# Install FFmpeg (Critical for your 'fluent-ffmpeg' compression)
RUN apt-get update && apt-get install -y ffmpeg

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Cloud Run defaults to port 8080, but your app uses process.env.PORT
# This line is for documentation purposes
EXPOSE 8080

# Start the server
CMD [ "node", "server.js" ]