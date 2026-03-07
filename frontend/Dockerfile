FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json first to leverage caching
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Build the Vite React app
RUN npm run build

# Serve Stage
FROM nginx:alpine

# Add a custom nginx configuration to handle React Router client-side routing
RUN rm /etc/nginx/conf.d/default.conf
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

# Copy the built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
