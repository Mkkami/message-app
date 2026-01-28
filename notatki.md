# TOTP
Potrzebny jest aktualny czas i secret.
1. Obliczanie liczby interwałów T - czas jest dzielony na okienka (30 sekundowe) T = floor[T_unix/C]
2. System bierze shared secret i obliczoną liczbę interwałów T i haszuje HMAC-SHA1 - powstaje 20 bajtowy ciąg znaków
3. 20 bajtów jest za duże, więc algorytm wybiera fragment hasha i zamienia na liczbę całkowitą
4. Na koniec stosuje operację modulo 10^6, aby otrzymać 6 cyfr

**Przykład**:
1. T = 1 700 000 000 / 30 = 56 666 666
2. HMAC-SHA1(Klucz + 5 666 666) -> 1f2a3c4e5f67890abcde1234567890abcdef1234 (20 bajtów w systemie 16)
3. Algorytm patrzy na ostatni bajt (tutaj 4) i wycina zawsze 4 bajty zaczynając od 4 (miejsca) bajtu - 5f67890a
4. zamienia 5f67890a na liczbę - 1 600 620 810, potem przycina mod 6 - powstaje 620 810

# PBKDF2
Zamienia "słabe" (kryptograficznie) hasło na "silny" klucz, nadający się do szyfrowania. Spowalnia też czas brute-force.
1. Sól zapobiega atakom typu "rainbow tables"
2. Pierwsza iteracja - U<sub>1</sub> = HMAC(hasło, sól)
3. Kolejne iteracje - U<sub>x</sub> = HMAC(hasło, U<sub>x-1</sub>)
4. XOR na każdej iteracji T = U<sub>1</sub> ⊕ U<sub>2</sub> ⊕ ... ⊕ U<sub>600 000</sub>
5. Przycięcie klucza do pożądanej długości `{name: "AES-GCM", length: 256 }


# Argon2id
- v = 19 - wersja, najnowsza
- m = 65536 - koszt pamięciowy - 64MB potrzebne do obliczenia tego hasha
- t = 3 - ilość iteracji
- p = 4 - równoległość - tyle wątków zostało wykorzystane
---
1. Inicjalizacja - argon2 bierze hasło i sól, i wypełnia nimi pierwsze dwa bloki macierzy pamięci (64 MB)
2. Wypełnianie pamięci - bierze blok bezpośrednio poprzedni oraz losowy z poprzednich
3. Przechodzenie przez pamięć - znowu wypełnia pamięć tak samo
4. Hashowanie - bierze całą pamięć i przepuszcza przez Blake2b, dając hash
> d - wybiera blok na podstawie wartości poprzednich bloków, niebezpieczne przeciwko GPU \
> i - losowy na podstawie generatora liczb pseudolosowych, który nie zależy od hasła. Odporny na ataki czasowe, ale łatwiejszy do złamania \
> id - pierwszy jako bezpieczeństwo "i", resztę jako "d"


# AES-GCM
Input:
- klucz - 256 bitowy sekret
- plaintext - dane do zaszyfrowania
- IV - wektor inicjalizacji - losowy, zapewnia unikalność każdego szyfrowania
Output:
- ciphertext - zaszyfrowane dane
- tag uwierzytelniający - 16 bajtów. Chroni przed zmianą bitów szyfrogramu

### Krótki opis AES:
> AES określa co się dzieje na macierzy, tryby określają co się dzieje pomiędzy macierzami.
1. Rozszerzenie klucza - tworzy zestaw podkluczy rund
2. Dodawanie klucza rundy - każdy bajt macierzy jest łączony z odpowiadającym mu bajtem podklucza rundy.
    > Jeśli bajt danych to 1010 a bajt klucza to 1100 to XOR = 0110.
3. Rundy:
    1. Zamiana bajtów - każdy bajt macierzy jest zamieniany wg. `S-Box`
    2. Zamiana wierszy - trzy ostatnie wiersze macierzy są zmieniane określoną ilość razy W LEWO
        > 2 wiersz przesuwamy o 1 pozycję, 3. wiersz o 2 itd.
        > \
        > Jeśli wiersz 2 to [A, B, C, D], to po przesunięciu mamy [B, C, D, A]. To się dzieje w każdym wierszu!
    3. Mieszanie kolumn - łączy 4 bajty w ostatniej kolumnie
        > Operacja matematyczna, która traktuje każdą kolumnę jak wielomian i mnoży ją przez specjalną stałą macierz
    4. Dodanie klucza rundy - powtórzenie XOR z kolejnym podkluczem (to samo co krok 2)
4. Ostatnia runda:
    1. Zmiana bajtów
    2. Zmiana wierszy
    3. Dodaj klucz rundy
### GCM:
Counter Mode (CM):
1. Licznik - bierze IV, dokleja do niego licznik
    > `IV | 001`, `IV | 002`, `IV | 003`
2. Te bloki są wrzucane do AES. Wychodzi losowy ciąg bajtów
3. XOR: ten losowy ciąg jest łączony (XOR) z plaintext (danymi).

Galois Message Authentication Code (GMAC):
1. Bierze zaszyfrowane bloki danych
2. Mieli je przez funkcję GHASH (używając klucza **H**, który jest wynikiem szyfrowania bloku zer kluczem głównym AES)
3. Wynikiem jest 16-bajtowy tag
### Cały proces:
1. Generuje losowy IV
2. AES szyfruje liczniki oparte na IV
3. XOR szyfru z danymi -> ciphertext
4. Wszystkio przechodzi przez funkcję GHASH -> Tag
5. Wysłanie
### Deszyfrowanie:
1. Odtwarza klucz (IV + licznik)
2. Deszufruje przez XOR
    > plaintext XOR klucz = ciphertext
    > \
    > ciphertext XOR klucz = plaintext
3. Weryfikacja tagu

# DH i ECDH
### DH:
1. Wybieramy liczbę pierwszą `p` i generator `g`
2. Moje klucze: prywatny `a`, publiczny `A` = g<sup>a</sup> (mod p)
3. Jego klucze: prywatny `b`, publiczny `B` = g<sup>b</sup> (mod p)
4. Wspólny sekret: S = B<sup>a</sup> = A<sup>b</sup>
> Przykład: \
> p = 23, g = 5 \
> a = 6, b = 15 \
> A: 5^6 (mod 23) = 15 625 (mod 23) = 8 \
> B: 5^15 (mod 23) = 20 517 578 125 (mod 23) = 19 \
> Przesyłają sobie A i B \
> 19^6 (mod 23) = 2 \
> 8^15 (mod 23) = 2 

### ECDH (x25519):
Zamiast wzoru g<sup>a</sup> wykonujemy operację mnożenia punktu na krzywej:
1. Mamy stały punkt bazowy G na krzywej
2. Mój klucz prywatny d<sub>A</sub> to duża liczba losowa
3. Mój klucz publiczny Q<sub>A</sub> to punkt na krzywej Q<sub>A</sub> = d<sub>A</sub> x G (wielokrotne dodawanie punktu na krzywej)
4. Sekret to: S = d<sub>A</sub> x Q<sub>B</sub> (mój prywatny, jego publiczny)
> Punkt G jest stały i niezmienny dla curve25519. Dlatego wystarczy wygenerować klucze prywatne, a algorytm obliczy punkt na krzywej (G x d).

**Dlaczego ECDH?**:
- Szybsze obliczenia
- Krótszy klucz w porównaniu do DH, aby uzyskać ten sam poziom bezpieczeństwa

# HKDF
- wygładza entropię - bity ECDH nie są idealnie losowe. HKDF rozciąga entropię równomiernie na wszystkie bity. Dzięki temu mamy lepszy klucz AES
- dopasowuje długość - klucz AES potrzebuje 256 bitów.


# Wysyłanie wiadomości
## PFS
PFS dla nadawcy - generowana jest tymczasowa para kluczy X25519.
Chroni to przed sytuacją, gdzie kradzież klucza nadawcy pozwoliłaby na odszyfrowanie wysłanych przez niego danych.
Kradzież klucza prywatnego odbiorcy wciąż pozwala na przeczytanie wiadomości.
Do pełnego PFS, należałoby wykorzystać mechanizm jednorazowych kluczy publicznych.
## HKDF
Shared secret z ECDH to punkt na krzywej eliptycznej. Nie nadaje się bezpośrednio jako klucz AES bo:
- nie jest idealnie "losowy" - słaby rozkład entropii. HKDF wygładza ją, aby każdy bit klucza był równie trudny do zgadnięcia
- standarcy (NIST, RFC) wymagają użycia KDF, aby oddzielić warstwę matematyczną od warstry symetrycznej.
## GCM + Ed25519
- AES-GCM: gwarantuje że szyfr nie został zmieniony w transporcie. Zmiana nawet jednego bitu w ciphertext wyrzuci błąd.
- Ed25519: zapewnia autentyczność i niezaprzeczalność - mamy pewność że nikt nie podłożył fałszywej wiadomości pod imię nadawcy.

# Ciasteczko
- secret_key - sól do tworzenia podpisu (HMAC)
- same_site=lax - obrona przed csrf. Decyduje, kiedy ciasteczko powinno być dołączone do zapytania.
    - lax - jest wysyłane tylko w mojej domenie, ale też dla bezpiecznych nawigacji z zewnątrz. Nie zostanie wysłane przy iframe.
    - strict - nie wyśle przy nawigacji
    - none - wyśle nawet w iframe

# CSRF
Jeśli jestem na innej stronie `bad.com`, a ma ona ukryty formularz lub skrypt, który wysyła żądanie pod adres `bank.pl`, to automatycznie dołącza moje ciasteczko. Jeśli te ciasteczko jest poprawne, to zostanie wykonany zły przelew.
Obrona:
1. `same_site`=lax - zła strona - nie dołączy ciasteczka, żądanie zostanie odrzucone
2. `X-Frame-Options` DENY - blokuje `<iframe>` - atakujący nie może ukryć mojej strony pod przezroczystą warstwą na swojej stronie
3. `Content-Security-Policy` - `default-src 'self'` oznacza, że skrypty mogą komunikować się tylko z moim serwerem. Utrudnia XSS.
4. `Referrer-Policy "strict-origin-when-cross-origin"` - jeśli moja strona wysyła żądanie do innej domeny, nginx ukrywa pełną ścieżkę, zostawia tylko domenę.
# Ochrona przed XSS
## CSP
Bez CSP, użytkownik może być narażony na atak XSS, ponieważ skrypty nie są blokowane (wymaga jeszcze użycia innerhtml).
- `default-src 'self'` - pozwala na wszystko, ale tylko z mojej domeny
- `script-src 'self'` - blokuje skrypty z obcych serwerów, oraz blokuje inline-scripts (kod wpisany bezpośrednio w `<script>`)
- `img-src 'self' data:` - pozwala na ładowanie obrazków z mojej domeny lub w formacie base64.
## Brak innerHTML
Przy użyciu `innerHTML` przeglądarka zinterpretuje to jako kod HTML, więc możliwe jest użycie `<script>`. Zamiast tego, używam textContent, co traktuje wszystko jako zwykły napis.
## Klucze w pamięci
Odszyfrowane klucze prywatne (i hasło) są przechowywane w pamięci, co uniemożliwia atakującemu zdobycia tych danych z localStorage lub sessionStorage.
## Http only cookie
Ciasteczko sesji ma ustawione flagę http only. Nawet jeśli atakujący odpali skrypt na stronie, to nie może odczytać ciasteczka, co chroni przed przejęciem konta