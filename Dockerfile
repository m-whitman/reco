# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd frontend && npm install

# Copy project files
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Default port (will be overridden by Railway)
ENV PORT=8888

# Expose port
EXPOSE ${PORT}

# Start command
CMD ["sh", "-c", "node server.js"]