# Use a lightweight base image
FROM node:slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the port on which your Express app runs
EXPOSE 8000

# Command to run your application
CMD ["node", "server.js"]
