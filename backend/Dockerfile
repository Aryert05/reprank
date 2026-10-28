# RepRank backend — Express + Mongoose API (Experiment 7)
FROM node:20-alpine

# Fail fast, run as production container
ENV NODE_ENV=production
WORKDIR /app

# Install dependencies from the existing package files (dev deps omitted)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the application source (backend/.env is excluded via .dockerignore)
COPY . .

# Express listens on 0.0.0.0:5002 (Node binds all interfaces by default)
EXPOSE 5002

# Use the existing start script
CMD ["npm", "start"]
