FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

FROM nginx:1.27-alpine

COPY index.html global.css /usr/share/nginx/html/
COPY public /usr/share/nginx/html/public
COPY mocks /usr/share/nginx/html/mocks
COPY --from=builder /app/dist /usr/share/nginx/html/dist
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
