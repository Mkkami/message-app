
# build
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# instalacja zależności (clean install - te same wersje co w lockfile)
RUN npm ci

# kopia kodu
COPY . .

# budowa apk
RUN npm run build

FROM nginx:stable-alpine

# usunięcie strony domyślnej
RUN rm -rf /usr/share/nginx/html/*

# kopiowanie zbudowanej apk
COPY --from=builder /app/dist /usr/share/nginx/html

# kopiowanie własnej konfiguracji nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]