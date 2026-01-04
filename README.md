# message-app

### Logowanie
1. Dane wejściowe
  - użytkownik podaje username i password
  - serwer odbiera dane
  - sprawdza ich poprawność
2. 2FA
  - serwer wysyła kod TOTP
  - użytkownik go skanuje
  - serwer pobiera enc_2fa_key
  - odszyfrowuje go Master keyem serwera (.env)
  - `pyotp` do sprawdzenia kodu (uwzględniając okno czasowe T-1, T, T+1)
  - serwer daje session_id
3. Klucze
  - serwer przesyła klucze z UserKeys
  - PBKDF2(hasło + salt) -> Master Key
  - przeglądarka odszyfrowuje klucze prywatne
  - klucze są przechowywane w `Context API` Reacta

### Rejestracja
1. Dane wejściowe
  - użytkownik podaje username i password
  - w przeglądarce jest sprawdzana siła hasła
  - na serwerze jest sprawdzane, czy nazwa użytkownika jest wolna `GET /check-username?name=uname`
2. Klucze
  - W przeglądarce generowane są pary kluczy: Ed25519 i X25519
3. Zabezpieczenie kluczy
  - generuje losowy salt
  - PBKDF2(password + salt) -> master key
  - klucze prywatne są szyfrowane master key'em
4. Użytkownik wysyła na serwer:
```json
{
  "username": "string",
  "password": "string",
  "public_keys": {
    "signing": "base64",
    "encryption": "base64"
  },
  "private_keys": {
    "signing_enc": "base64_blob",
    "encryption_enc": "base64_blob",
    "salt": "base64",
    "iv": "base64"
  }
}


```
### 2FA (TOTP)
- serwer generuje unikalny klucz do 2FA
- użytkownik skanuje (podaje) ten klucz do aplikacji
- serwer prosi o wpisanie kodu wyświetlonego w aplikacji (aby upewnić się że działa)
- serwer potwierdza działanie kodu
- serwer szyfruje klucz 2FA algorytmem AES-GCM używając master keya z serwera i go zapisuje w tabeli użytkownika
- musi też uwzględnić problemy z synchronizacją zegara (T, T-1, T+1)
- użytkownik kończy proces rejestracji


## Wysłanie wiadomości
1. Przygotowanie załącznika:
  - generacja losowego klucza K_att i wektora IV_att
  - zaszyfrowanie załącznika AES-GCM, otrzymane: encrypted_att i tag_att
2. Przygotowanie treści
  - struktura JSON (tekst wiadomości + dane załącznika: klucz, IV, tag, nazwa pliku)
3. Podpisanie wiadomości:
  - Hash (SHA-512) ze struktury JSON
  - Podpis hasha swoim kluczem prywatnym Ed25519, otrzymane: signature
  - Dołączenie signature do JSON'a
4. Szyfrowanie wiadomości:
  - Losowy klucz K_msg (AES-256)
  - zaszyfrowanie JSON'a (z podpisem) kluczem K_msg, otrzymując ciphertext i tag_msg
5. Zaszyfrowanie klucza (ECDH):
  - pobranie klucza publicznego odbiorcy (B_pub)
  - wygenerowanie tymczasowej pary kluczy: prywatny (e) i publiczny (E)
  - Obliczenie shared key S: ECDH(e, B_pub)
  - Obliczenie K_wrap przez HKDF(S)
  - zaszyfrowanie K_msg za pomocą K_wrap
6. Wysłanie
  - wysyłane jest:
```text
E, IV_msg, Tag_msg, ciphertext, enc_K_msg, enc_file
```


## Odbiór
1. Pobranie danych
2. Odzyskanie klucza sesji:
  - użycie swojego klucza prywatnego b i otrzymanego E
  - obliczenie shared key S: ECDH(b, E)
  - HDKF na S -> K_wrap
  - Odszyfrowanie K_msg
3. Odszyfrowanie treści:
  - użycie K_msg, IV_msg i Tag_msg do odszyfrowania Ciphertext
  - jeśli tag się nie zgadza - wiadomość została uszkodzona lub zmieniona.
4. Weryfikacja podpisu:
  - signature z JSON
  - pobranie klucza publicznego A nadawcy
  - weryfikacja signature wzgl. treści
5. Odszyfrowanie załącznika:
  - Wyciągnięcie z JSON'a: K_att, IV_att, Tag_att
  - Odszyfrowanie pobranego pliku

### Załączniki
```json
{
    "text": "string",
    "att_key": "string",
    "att_iv": "string",
    "filename": "string",
    "signature": "Ed_string"
}
```

## Tech
- Backend - FastAPI
  - cryptography: Ed25519, X25519 (ECDH), AES-GCM, HKDF
  - pyotp: 2FA (TOTP)
  - passlib[argon2]: Argon2id
- Frontend - React
  - noble-curves: ed25519, x25519
  - Web Crypto API (przeglądarka): AES-GCM, HKDF (SHA-256)
  - qrcode.react: do kodu QR podczas konfiguracji 2FA
  - PBKDF2: tworzenie klucza z hasła + salt do szyfrowania kluczy pryw.
  - zxcvbn: sprawdzenie siły hasła

## Algorytmy
- Argon2id: hashowanie haseł do db
- Ed25519 (EdDSA): podpisywanie treści wiadomości
- X25519 (ECDH): wygenerowanie shared key
- HKDF (SHA-256): wygładzenie shared key
- AES-256-GCM: szyfrowanie i deszyfrowanie wiadomości oraz kluczy 2FA
- TOTP: weryfikacja kodów 6-cyfrowych podczas 2FA
- SHA-512: tworzenie podpisu
- PBKDF2-HMAC-SHA256: generowanie klucza deszyfrującego klucze prywatne z hasła

# Baza danych
[Link](https://dbdiagram.io/d/693eb807e877c63074c38186)
![image](img/db.svg)
```DBML
Table User {
  id int [pk]
  username varchar [unique]
  password_hash varchar
  //2FA
  enc_2fa_key string
}

Table UserKeys {
  id int [pk]
  user_id int [ref: - User.id]

  //public keys
  signing_pub_key string //Ed25519 - EdDSA
  encryption_pub_key string //Curve25519 - ECDH
  //private keys (zaszyfrowane hasłem)
  signing_priv_enc blob
  encryption_priv_enc blob
  //IV
  signing_priv_iv string
  encryption_priv_iv string

  key_salt string //salt do Argon2/PBKDF2 przy deszyfrowaniu kluczy
}

Table Message {
  id int [pk]
  sender_id int [ref: > User.id]
  //Treść
  content_enc blob // + tag
  iv blob // do contentu
  //Ephemeral key nadawcy do ECDH (unikalny do wiadomości)
  eph_public_key string
  created_at datetime
}

Table Message_Recipients {
  id int [pk]
  message_id int [ref: > Message.id]
  recipient_id int [ref: > User.id]
  // klucz AES wiadomości, zaszyfrowany HKDF(ECDH) do konkretnego odbiorcy
  enc_AES_key string
  iv blob //do klucza
  is_read boolean
}

Table Attachment {
  id int [pk]
  message_id int [ref: > Message.id]
  file_path string
  mime_type string
}

```

# Problemy
## Możliwość przeczytania wiadomości przez wysyłającego:
- Wtedy zaszyfrowana wiadomość musi być też zapisana u wysyłającego, a klucz AES jest szyfrowany kluczem łączonym z wygenerowanego prywatnego (e) i własnego publicznego (A).
- Można tą wiadomość wysłać na serwer
- lub zapisać lokalnie - wtedy gdy ktoś się dostanie na konto tego użytkownika, to nie będzie widział historii wysłanych wiadomości.