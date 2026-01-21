# generate ssl certs
FROM nginx:stable-alpine
RUN apk add --no-cache openssl
RUN mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
    -keyout /etc/nginx/certs/selfsigned.key \
    -out /etc/nginx/certs/selfsigned.crt \
    -subj "/C=PL/ST=Warszawa/L=Warszawa/O=PW/CN=localhost"
