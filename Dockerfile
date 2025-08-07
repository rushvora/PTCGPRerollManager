# Use the official Node.js image as the base image
FROM node:22.18.0-slim

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Command to run the application
CMD ["node", "index.mjs"]