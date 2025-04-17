# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
FROM node:lts-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

# Bundle app source
COPY . .

# Build the project (TypeScript)
RUN npm run build

# Expose volume for allowed directory if needed
VOLUME ["/data"]

# Run the MCP server. The allowed directory is provided as a parameter, here "/data" is used as default allowed directory.
CMD ["node", "dist/index.js", "/data"]
