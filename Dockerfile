# ---- Builder Stage ----
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* tsconfig.json ./

# Copy the rest of the code
COPY . .

# Install all dependencies (including devDependencies)
RUN npm install

# Build the TypeScript project
RUN npm run build

# ---- Runtime Stage ----
FROM node:20-alpine

# Set environment variables
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set workdir and copy built files
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set ownership
RUN chown -R appuser:appgroup /app
USER appuser

# Entry point (MCP 표준: node로 실행)
ENTRYPOINT ["node", "dist/index.js"]
