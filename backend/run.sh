#!/bin/sh

if [ -z "$VIRTUAL_ENV" ]; then
    . .venv/Scripts/activate
fi

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
