   
FROM node:18-alpine
COPY . .
WORKDIR /app
EXPOSE 3001
RUN yarn install --production
CMD ["node", "index.js"]
