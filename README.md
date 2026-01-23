# SecureMsgApp

## How to run
### Setup script
Use the setup script - it will generate required `.env` files.
You can also configure it by yourself below.
```bash
./setup.py [reset]
```
or
```bash
python3 setup.py [reset]
```
## Config
### 1. SSL Certificates
```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
  -keyout nginx/certs/selfsigned.key \
  -out nginx/certs/selfsigned.crt
```
### 2. Env variables (.env)
Create `.env` in root folder (`./message-app/.env`)
```
DOMAIN_NAME=localhost
VITE_API_URL=https://localhost/api
SESSION_SECRET_KEY=backend_key
TOTP_SECRET_KEY=totp_key
DATABASE_URL=sqlite:///./data/app.db
```
## Run app
```bash
docker compose up --build [-d]
```
App will be available at: `https://localhost`
### Dev mode (with reload)
```bash
docker compose -f dev-docker-compose.yml up --build [-d]
```

