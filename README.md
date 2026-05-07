# 📚 System Zarządzania Księgarnią Internetową

Kompletna aplikacja webowa do zarządzania sprzedażą książek, składająca się z frontendu w Angularze oraz backendu w Node.js z bazą danych PostgreSQL.

---

## 🛠️ Architektura Systemu
*   **Frontend:** Angular (v21.2.8)
*   **Backend:** Node.js + Express.js
*   **Baza danych:** PostgreSQL
*   **Komunikacja:** REST API + Socket.io (powiadomienia w czasie rzeczywistym)

---

## 🗄️ Backend i Baza Danych

### Instrukcja Przywracania Bazy Danych PostgreSQL
Poniższa instrukcja opisuje proces przenoszenia i importu bazy danych z pliku `.sql` na serwer PostgreSQL (Linux).

#### 1. Przesłanie pliku na serwer
Jeśli masz plik na Windowsie, prześlij go na serwer (używając PowerShell lub CMD):
```bash
scp ksiegarnia.sql uzytkownik_linux@adres_ip_serwera:~/
```

#### 2. Przygotowanie bazy danych
Najpierw należy utworzyć pustą bazę, do której trafią dane. Zaloguj się na serwer i wykonaj:
```bash
sudo -u postgres psql
```
Wewnątrz powłoki `psql` wpisz:
```sql
CREATE DATABASE ksiegarnia;
\q
```

#### 3. Import danych
Wykonaj poniższą komendę w terminalu Ubuntu (nie wewnątrz psql), aby wgrać dane z pliku:
```bash
sudo -u postgres psql ksiegarnia < ksiegarnia.sql
```

> **Wskazówka:** Jeśli otrzymasz błąd uprawnień, nadaj plikowi prawa do odczytu:
> `chmod 644 ksiegarnia.sql`

---

## 💻 Frontend (Angular)

### Uruchamianie lokalne
Aby zainstalować zależności i uruchomić serwer deweloperski:

1.  Zainstaluj paczki: `npm install`
2.  Uruchom projekt:
    ```bash
    ng serve
    ```
3.  Otwórz przeglądarkę na: `http://localhost:4200/`

### Przydatne komendy Angular CLI

| Zadanie | Komenda |
| :--- | :--- |
| **Generowanie komponentu** | `ng generate component nazwa-komponentu` |
| **Budowanie wersji produkcyjnej** | `ng build` |
| **Testy jednostkowe (Vitest)** | `ng test` |
| **Pomoc CLI** | `ng generate --help` |

---

## 🚀 Instalacja Backend (Node.js)

1.  Wejdź do katalogu serwera.
2.  Zainstaluj zależności:
    ```bash
    npm install
    ```
3.  Skonfiguruj plik `.env`:
    ```env
    DB_USER=postgres
    DB_HOST=localhost
    DB_NAME=ksiegarnia
    DB_PASSWORD=twoje_haslo
    JWT_SECRET=super_tajny_klucz
    PORT=3000
    ```
4.  Uruchom serwer:
    ```bash
    node index.js
    ```

---

## 📸 Zarządzanie Zdjęciami
Zdjęcia książek są przechowywane w folderze `/img` na serwerze.
*   **Dostęp przez URL:** `http://IP_SERWERA:3000/img/nazwa_pliku.jpg`
*   **Uprawnienia:** Upewnij się, że folder ma uprawnienia `755`, aby serwer mógł serwować pliki.

---

## 👥 Autorzy
*   **Maciej Strzelec**
*   **Wojciech Złonkiewicz**

---
*Dokumentacja utworzona na potrzeby projektu "Księgarnia" - 2026.*
