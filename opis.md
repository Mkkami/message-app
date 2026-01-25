# Dokumentacja Projektu: Secure Message App

## 1. Stos Technologiczny i Architektura

Aplikacja składa się z trzech głównych kontenerów:

1.  **Frontend (`/frontend`)**:
    *   **Framework**: React (z Vite).
    *   **Język**: TypeScript.
    *   **UI Library**: Ant Design.
    *   **Kryptografia**: `noble-curves` (Ed25519, X25519), Web Crypto API (AES-GCM, PBKDF2, HKDF).
    *   **Rola**: Interfejs użytkownika, generowanie kluczy kryptograficznych, szyfrowanie/deszyfrowanie wiadomości po stronie klienta (E2EE), komunikacja z API.

2.  **Backend (`/backend`)**:
    *   **Framework**: FastAPI (Python).
    *   **Baza Danych**: SQLite (obsługiwana przez SQLAlchemy ORM).
    *   **Kryptografia**: `passlib` (Argon2 do haseł), `cryptography` (AES-GCM do 2FA), `pyotp` (TOTP).
    *   **Rola**: REST API, zarządzanie użytkownikami, przechowywanie zaszyfrowanych kluczy i wiadomości, obsługa 2FA, walidacja danych (Pydantic).

3.  **Proxy (`/nginx`)**:
    *   **Serwer**: NGINX.
    *   **Rola**: Reverse Proxy, terminacja SSL/TLS, serwowanie plików statycznych frontendu, przekierowywanie zapytań API do backendu, implementacja nagłówków bezpieczeństwa, rate limiting.

**Komunikacja:**
Użytkownik łączy się z NGINX (przez HTTPS). NGINX serwuje aplikację React (dla ścieżek `/`) lub przekazuje zapytania do kontenera Backend (dla ścieżek `/api/`). Backend i Frontend nie są wystawione bezpośrednio na świat.

---

## 2. Opis Funkcjonalności

### 2.1. Rejestracja Użytkownika
Celem jest utworzenie konta oraz bezpieczne wygenerowanie i zapisanie kluczy kryptograficznych.

1.  **Generowanie Kluczy (Frontend)**:
    *   Aplikacja generuje parę kluczy do podpisu (Ed25519) oraz parę kluczy do szyfrowania (X25519).
    *   Generowana jest losowa sól (`salt`).
2.  **Szyfrowanie Kluczy (Frontend)**:
    *   Klucze prywatne są szyfrowane algorytmem AES-GCM (256-bit).
    *   Klucz szyfrujący do AES jest wyprowadzany z hasła użytkownika i soli przy użyciu algorytmu PBKDF2 (SHA-256, 600,000 iteracji).
3.  **Wysyłka (API)**:
    *   Frontend wysyła do API: `username`, hasło (do uwierzytelniania), klucze publiczne (jawne), klucze prywatne (zaszyfrowane AESem) oraz sól.
4.  **Zapis (Backend)**:
    *   Backend sprawdza siłę hasła (`zxcvbn`) i unikalność loginu.
    *   Hasło do logowania jest hashowane algorytmem Argon2id i zapisywane w bazie.
    *   Klucze są zapisywane w tabeli `user_keys`.

### 2.2. Logowanie i 2FA
Proces wieloetapowy zapewniający bezpieczeństwo dostępu.

1.  **Uwierzytelnienie (Etap 1)**: Użytkownik podaje login i hasło. Backend weryfikuje hash Argon2.
2.  **Konfiguracja 2FA (jeśli brak)**: Jeśli użytkownik nie ma 2FA, backend wymusza setup. Generowany jest sekret TOTP, zapisywany w bazie (szyfrowany kluczem aplikacji AES-GCM). Użytkownik skanuje kod QR.
3.  **Weryfikacja 2FA (Etap 2)**: Użytkownik podaje kod z aplikacji Authenticator. Backend weryfikuje kod TOTP.
4.  **Sesja**: Po poprawnym 2FA ustawiana jest sesja HTTP-only cookie.
5.  **Pobranie Kluczy**: Frontend pobiera zaszyfrowane klucze prywatne z API i używa hasła z logowania, aby je odszyfrować lokalnie (przechowywane jest w pamięci, więc po przeładowaniu strony trzeba się zalogować ponownie).

### 2.3. Wysłanie Zaszyfrowanej Wiadomości
Zastosowano model szyfrowania hybrydowego z podpisem cyfrowym.

1.  **Payload**: Frontend przygotowuje JSON zawierający treść wiadomości i dane załącznika (Base64).
2.  **Szyfrowanie Symetryczne (Treść)**:
    *   Generowany jest losowy klucz sesyjny AES (32 bajty) i IV (12 bajtów).
    *   Payload jest szyfrowany algorytmem AES-GCM przy użyciu tego klucza.
3.  **Szyfrowanie Klucza (Dla Odbiorców)**:
    *   Dla każdego odbiorcy generowany jest tymczasowy klucz pary X25519 (efemeryczny).
    *   Frontend wykonuje operację ECDH (klucz efemeryczny prywatny + klucz publiczny odbiorcy) aby uzyskać wspólny sekret.
    *   Wspólny sekret jest przepuszczany przez funkcję HKDF (SHA-256) aby uzyskać klucz do szyfrowania klucza sesyjnego (Key Wrapping).
    *   Klucz sesyjny AES (z pkt 2) jest szyfrowany tym wyliczonym kluczem.
4.  **Podpis Cyfrowy**:
    *   Zaszyfrowana treść (ciphertext + IV) oraz klucz publiczny efemeryczny są podpisywane kluczem prywatnym Ed25519 nadawcy.
5.  **Wysyłka**: Cała paczka (ciphertext, podpis, klucz efemeryczny, lista zaszyfrowanych kluczy dla odbiorców) trafia do API.

### 2.4. Odbiór Wiadomości
1.  **Pobranie**: Frontend pobiera zaszyfrowaną wiadomość i odpowiedni dla swojego użytkownika zaszyfrowany klucz sesyjny.
2.  **Weryfikacja Podpisu**: Frontend weryfikuje podpis wiadomości używając klucza publicznego nadawcy (Ed25519). Jeśli podpis się nie zgadza -> błąd integritiy.
3.  **Odszyfrowanie Klucza**:
    *   Frontend używa swojego klucza prywatnego X25519 i klucza efemerycznego nadawcy (z wiadomości) do wykonania ECDH + HKDF.
    *   Uzyskanym kluczem odszyfrowuje klucz sesyjny AES.
4.  **Odszyfrowanie Treści**: Kluczem sesyjnym AES odszyfrowuje payload (AES-GCM weryfikuje też tag autentyczności).
5.  **Załącznik**: Jeśli wiadomość zawierała załącznik, jest on dekodowany z Base64 i umożliwiony do pobrania.

---

## 3. Schemat Bazy Danych (DBML)
![image](img/db.svg)
```dbml
Table users {
  id integer [primary key]
  username varchar [unique, not null]
  password_hash varchar [not null]
  totp_secret varchar [null, note: 'Szyfrowany AES-GCM kluczem serwera']
  is_2fa_enabled boolean [default: false]
}

Table user_keys {
  id integer [primary key]
  user_id integer [ref: > users.id]
  signing_pub_key varchar [not null]
  encryption_pub_key varchar [not null]
  signing_priv_key varchar [not null, note: 'Szyfrowany AES-GCM hasłem użytkownika']
  encryption_priv_key varchar [not null, note: 'Szyfrowany AES-GCM hasłem użytkownika']
  key_salt varchar [not null]
}

Table messages {
  id varchar [primary key]
  sender_id integer [ref: > users.id]
  ciphertext text [not null, note: 'Szyfrogram (Treść + Załącznik)']
  signature text [not null, note: 'Podpis Ed25519']
  eph_key varchar [not null, note: 'Klucz publiczny efemeryczny nadawcy']
}

Table message_recipients {
  id varchar [primary key]
  message_id varchar [ref: > messages.id]
  recipient_id integer [ref: > users.id]
  enc_aes_key text [not null, note: 'Klucz sesyjny zaszyfrowany dla odbiorcy']
  is_read boolean [default: false]
}
```

---

## 4. Opis Konfiguracji NGINX
1.  **SSL/TLS**:
    *   Serwer nasłuchuje na porcie 443 (HTTPS).
    *   Wymusza protokoły TLSv1.2 i TLSv1.3.
    *   Wyłącza słabe szyfry (`ssl_prefer_server_ciphers off`).
    *   Wykorzystuje certyfikaty self-signed (dla celów deweloperskich/projektowych) zmapowane z wolumenu `./nginx/certs`.
2.  **Przekierowanie HTTP->HTTPS**: Ruch na porcie 80 jest automatycznie przekierowywany na 443 (Code 301).
3.  **Nagłówki Bezpieczeństwa (Security Headers)**:
    *   `Strict-Transport-Security`: Wymusza łączenie przez HTTPS (HSTS).
    *   `X-Frame-Options DENY`: Zapobiega atakom Clickjacking (brak możliwości osadzania w iframe).
    *   `X-Content-Type-Options nosniff`: Zapobiega zgadywaniu typu MIME.
4.  **Reverse Proxy**:
    *   `/api/`: Przekazuje zapytania do kontenera `backend` na port 8000. Ustawia nagłówki `X-Real-IP` i `X-Forwarded-For` dla rate limitigu.
    *   `/`: Kieruje ruch do kontenera `frontend` na port 80.
5.  **Limity**:
    *   `client_max_body_size 20M`: Ogranicza wielkość żądania (zapobiega DoS przez wysyłanie gigantycznych plików), co odpowiada limitom aplikacji (wiadomość + załącznik).