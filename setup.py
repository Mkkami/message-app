#!/usr/bin/env python
import os
import secrets
import subprocess
import sys

def create_folders():
    folders = ["backend/data", "nginx/certs"]
    for folder in folders:
        if not os.path.exists(folder):
            os.makedirs(folder)
            print("Created folder:", folder)

def generate_env():
    if os.path.exists(".env"):
        print(".env file already exists. Skipping.")
        return
    
    secret_key = secrets.token_hex(32)
    totp_key = secrets.token_hex(32)

    env_content = f"""# --- Backend ---
SESSION_SECRET_KEY={secret_key}
TOTP_SECRET_KEY={totp_key}
DATABASE_URL=sqlite:///./data/app.db

# --- Frontend ---
VITE_API_URL=https://localhost/api
"""
    with open(".env", "w") as f:
        f.write(env_content)
    
    print(".env file created.")

def generate_certs():
    cert_dir = "nginx/certs"
    if not os.path.exists(cert_dir):
        os.makedirs(cert_dir)

    if os.path.exists(f"{cert_dir}/selfsigned.crt"):
        print("SSL certificates already exist. Skipping.")
        return
    print("Generating self-signed SSL certificates...")
    subprocess.run([
        "openssl", "req", "-x509", "-nodes", "-days", "365",
        "-newkey", "rsa:2048",
        "-keyout", f"{cert_dir}/selfsigned.key",
        "-out", f"{cert_dir}/selfsigned.crt",
        "-subj", "/C=PL/ST=State/L=City/O=SecureMsg/CN=localhost"
    ])
    print("SSL certificates generated.")

def reset():
    # subprocess.run(["docker-compose", "down", "-v"])
    files_to_remove = [".env", "nginx/certs/selfsigned.crt", "nginx/certs/selfsigned.key"]
    for file in files_to_remove:
        if os.path.exists(file):
            os.remove(file)
    print("Reset complete.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "reset":
        reset()
    else:
        create_folders()
        generate_env()
        generate_certs()