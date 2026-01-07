
# build
FROM python:3.11-slim AS build

# nie będzie tworzył plików .pyc (mniejsze zużycie miejsca)
ENV PYTHONDONTWRITEBYTECODE=1
# logi będą od razu wypisywane do konsoli
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# update systemu, instalacja zależności, czyszczenie cache
# minimalnie, żeby nie było niepotrzebnych narzędzi
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .


# post-build
FROM python:3.11-slim

WORKDIR /app

COPY --from=build /app/wheels /wheels
COPY --from=build /app/requirements.txt .

# instalacja zależności pythona
RUN pip install --no-cache-dir /wheels/*

# użytkownik aplikacji, żeby nie działać jako root
RUN addgroup --system appuser && adduser --system --group appuser

# folder na załączniki
RUN mkdir -p /app/uploads && chown appuser:appuser /app/uploads

# kopiowanie plików aplikacji i zmiana właściciela
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", \
    "--proxy-headers", "--forwarded-allow-ips", "*"]
# proxy bo fastapi działa za nginx - pozwala odczytać ip klienta
# forwarded allow ips * - ufa nagłówkom proxy