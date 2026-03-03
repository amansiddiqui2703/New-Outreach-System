FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/
RUN mkdir -p uploads
EXPOSE 5000
CMD ["node", "src/index.js"]
