# message-app

### Logowanie
- użytkownik podaje username i password
- system sprawdza poprawność danych
- system wysyła OK z np. session_id
- użytkownik wysyła session_id z kodem 2FA
- system sprawdza kod dla danego użytkownika
- poprawny -> wysyła cookie

### Rejestracja
- użytkownik podaje username i password
 - system sprawdza czy password jest odpowiednio silny
 - system sprawdza czy nie ma już takiego użytkownika
 - (jakieś biblioteki do sprawdzania hasła)
- system zapisuje użytkownika
- [2FA](#2fa-totp)
- (może podać jakiś jednorazowy kod jakby zgubił 2fa??)
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
    "att_tag": "string",
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
  
  - argon2-browser: argon2id (lub PBKDF2, wtedy nie trzeba .wasm)

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
  id int
  username varchar
  password_hash varchar
  //2FA
  enc_2fa_key string
  //public keys
  signing_pub_key string //Ed25519 - EdDSA
  encryption_pub_key string //Curve25519 - ECDH
  //private keys (zaszyfrowane hasłem)
  signing_priv_enc blob
  encryption_priv_enc blob

  key_salt string //salt do Argon2/PBKDF2 przy deszyfrowaniu kluczy
}

Table Message {
  id int
  sender_id int
  //Treść
  content_enc blob
  iv blob
  GCM_tag string
  //Ephemeral key nadawcy do ECDH (unikalny do wiadomości)
  eph_public_key string

  created_at datetime
}

Table Message_Recipients {
  id int
  message_id int
  recipient_id int
  // klucz AES wiadomości, zaszyfrowany HKDF(ECDH) do konkretnego odbiorcy
  enc_AES_key blob
  is_read boolean
}

Table Attachment {
  id int
  message_id int
  file_path string
  mime_type string
}


Ref: "Message"."sender_id" < "User"."id"

Ref: "Message_Recipients"."message_id" < "Message"."id"

Ref: "Message_Recipients"."recipient_id" < "User"."id"

Ref: "Attachment"."message_id" - "Message"."id"

```

# Problemy
## Możliwość przeczytania wiadomości przez wysyłającego:
- Wtedy zaszyfrowana wiadomość musi być też zapisana u wysyłającego, a klucz AES jest szyfrowany kluczem łączonym z wygenerowanego prywatnego (e) i własnego publicznego (A).
- Można tą wiadomość wysłać na serwer
- lub zapisać lokalnie - wtedy gdy ktoś się dostanie na konto tego użytkownika, to nie będzie widział historii wysłanych wiadomości.