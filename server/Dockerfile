# Use an official Node.js runtime as a parent image
FROM node:20 as build

# Copy project files to container and download dependency
RUN mkdir -p /home/node/app/service-accounts/prod-config \
    /home/node/app/service-accounts/stage-config \
    /home/node/app/service-accounts/test-config
WORKDIR /home/node/app

COPY package*.json ./
COPY service-accounts/prod-config/serviceAccountKey*.json ./service-accounts/prod-config/
COPY service-accounts/stage-config/serviceAccountKey*.json ./service-accounts/stage-config/
COPY service-accounts/test-config/serviceAccountKey*.json ./service-accounts/test-config/

RUN npm install
RUN ls -l /home/node/app
COPY . .
RUN npm run build

# Build the container image
FROM node:20-alpine
WORKDIR /app
COPY --from=build /home/node/app/dist/ /app/dist
COPY --from=build /home/node/app/service-accounts/prod-config/serviceAccountKey*.json /app/service-accounts/prod-config/
COPY --from=build /home/node/app/service-accounts/stage-config/serviceAccountKey*.json /app/service-accounts/stage-config/
COPY --from=build /home/node/app/service-accounts/test-config/serviceAccountKey*.json /app/service-accounts/test-config/
COPY --from=build /home/node/app/node_modules /app/node_modules

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["node", "/app/dist/index.mjs"]
