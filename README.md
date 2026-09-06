# Malas Monorepo Template

> "Budayakan Malas. Simple dan Nggak Ribet"

A lightweight and simple monorepo template powered by Vite, React, and TanStack Router. Designed for speed and minimal overhead, with more tech integrations coming soon.

---

Template monorepo yang ringan dan sederhana, ditenagai oleh Vite, React, dan TanStack Router. Dirancang untuk kecepatan dan beban minimal, dengan lebih banyak integrasi teknologi yang akan segera hadir.




## Struktur Proyek
- `/api`: Backend API menggunakan Go (Chi, Ent, Postgres).
- `/dashboard`: Frontend dashboard menggunakan Vite + React + TanStack Router (sudah ada di template monorepo).
- `push.sh`: Script otomatis untuk push ke GitHub dengan pesan commit dinamis.

## API

Template API sederhana berbasis Go yang terletak di folder `/api`.

### Tech Stack
- **Framework:** [Chi](github.com/go-chi/chi)
- **ORM:** [Ent](entgo.io)
- **Database:** PostgreSQL
- **Authentication:** Google and Apple OAuth via `go-pkgz/auth`
- **Env Management:** [godotenv](github.com/joho/godotenv)

### Menjalankan API
1. Masuk ke direktori api: `cd api`
2. Salin `.env` template dan sesuaikan: `cp .env.example .env` (atau edit `.env` yang sudah ada)
   - Pastikan `DATABASE_URL` dan authentication environment variables sudah benar.
3. Jalankan API: `go run cmd/api/main.go`

### Endpoints
- `GET /` - Check status API
- `GET /auth/google/login` - Mulai Google OAuth
- `GET /auth/apple/login` - Mulai Apple OAuth
- `GET /auth/user` - Mendapatkan user yang sedang login
- `GET /auth/logout` - Menghapus session cookie
- `GET /me` - Endpoint terproteksi (memerlukan validasi token)

## Authentication (Google + Apple)

The API uses `go-pkgz/auth` OAuth handlers. Copy the example environment file before starting:

```bash
cp api/.env.example api/.env
```

Set the API values in `api/.env`:

```env
PORT=8080
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?sslmode=disable"
AUTH_URL="http://localhost:8080"
JWT_SECRET="replace-with-a-long-random-secret"

GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."

APPLE_CLIENT_ID="com.example.web"
APPLE_TEAM_ID="..."
APPLE_KEY_ID="..."
APPLE_PRIVATE_KEY_PATH="./AuthKey_ABC123.p8"
```

### Google

1. Open [Google Cloud Console](https://console.cloud.google.com/), select or create a project, then open **APIs & Services → Credentials**.
2. Configure the OAuth consent screen. For local testing, add your Google account under **Test users** if the app is still in testing.
3. Create **Credentials → Create credentials → OAuth client ID** and choose **Web application**.
4. Add this authorized redirect URI:

   ```text
   http://localhost:8080/auth/google/callback
   ```

5. Copy the generated **Client ID** to `GOOGLE_CLIENT_ID` and **Client secret** to `GOOGLE_CLIENT_SECRET`.

### Apple

Apple setup is usually **15–30 minutes** if you already have an Apple Developer account and App ID. The first setup can take **30–90 minutes**. Apple Developer enrollment, domain verification, or HTTPS setup can take longer.

Apple web authentication requires an Apple Developer account, an App ID with **Sign in with Apple**, a Services ID, and a private key. Follow Apple’s [web configuration guide](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/).

#### 1. Enable Sign in with Apple

In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list):

1. Open **Identifiers** and create or select your App ID.
2. Enable the **Sign in with Apple** capability.
3. Mark it as the primary App ID if Apple asks.

#### 2. Create a Services ID

1. In **Identifiers**, click **+** and choose **Services IDs**.
2. Enter a description and a unique identifier, for example `com.example.web`.
3. Register it, select it, enable **Sign in with Apple**, and click **Configure**.
4. Associate it with your primary App ID.
5. Add your website domain and this return URL:

   ```text
   http://localhost:8080/auth/apple/callback
   ```

   Apple may require a real HTTPS domain for web authentication. For local testing, use your deployed HTTPS URL or an HTTPS tunnel and register that exact callback URL instead.

#### 3. Create the Apple private key

1. Open **Keys** in [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/authkeys/list).
2. Click **+**, name the key, and enable **Sign in with Apple**.
3. Continue, confirm, and download the `.p8` file.
4. Copy the key identifier (`Key ID`) shown by Apple.

Apple only lets you download the private key once. Store it securely and never commit it.

#### 4. Fill the environment variables

Find the **Team ID** in Apple Developer **Membership details**, then set:

```env
APPLE_CLIENT_ID="com.example.web"       # Services ID
APPLE_TEAM_ID="ABCDEFGHIJ"              # 10-character Team ID
APPLE_KEY_ID="123456789A"               # Key ID
APPLE_PRIVATE_KEY_PATH="./AuthKey_123456789A.p8"
```

The path is relative to `api/` when running through Moon or after `cd api`.

#### 5. Test Apple login

Start the apps:

```bash
moon run :dev
```

Open `http://localhost:5173/sign-in` and click **Continue with Apple**. The API endpoint used by the frontend is:

```text
http://localhost:8080/auth/apple/login
```

After successful login, Apple redirects back to the frontend and the API stores the session in a cookie.

Never commit `api/.env` or the Apple `.p8` private key.

## Spec-Driven Plan

The `./plan` folder is the spec-driven to-do list for the repository. Every item must be written in Markdown.

- `./plan/idea`: planned work and ideas that have not started.
- `./plan/ongoing`: work currently in progress.
- `./plan/done`: completed work.

Move each Markdown item to the folder that matches its current status.
