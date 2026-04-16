# Use Node.js LTS version
FROM node:18-alpine

# Install Chromium and required system dependencies for Puppeteer on Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    && rm -rf /var/cache/apk/*

# Tell Puppeteer to use the installed Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies (Chromium download is skipped via ENV above)
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port (Render dynamically assigns PORT env var)
EXPOSE 10000

# Start the server
CMD ["node", "server.js"]
