# RepRank frontend — React + Vite multi-page app (Experiment 7)
# Development container: runs the existing Vite dev server + /api proxy.
FROM node:20-alpine

ENV NODE_ENV=development
WORKDIR /app

# Install dependencies from the existing frontend package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy the app source (node_modules, dist and .env files are excluded)
COPY . .

EXPOSE 5173

# --host 0.0.0.0 makes Vite reachable from outside the container.
# --port/--strictPort pin the container port to 5173 so the 8080:5173
# mapping always lines up. Local `npm run dev` behavior is unchanged.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
