FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=https://backend-production-4dea.up.railway.app/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine

ARG BACKEND_URL=https://backend-production-4dea.up.railway.app
ENV BACKEND_URL=$BACKEND_URL

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /tmp/nginx.conf.template

EXPOSE 4173

CMD ["sh", "-c", "envsubst '$BACKEND_URL' < /tmp/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
