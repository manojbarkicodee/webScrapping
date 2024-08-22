# Use the official Node.js image as base
FROM node:latest

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy application code
COPY . .

# Expose the port your app runs on
EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]

