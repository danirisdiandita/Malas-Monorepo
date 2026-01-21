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
- **Authentication:** Google Sign-In (OIDC) ID Token Verification
- **Env Management:** [godotenv](github.com/joho/godotenv)

### Menjalankan API
1. Masuk ke direktori api: `cd api`
2. Salin `.env` template dan sesuaikan: `cp .env.example .env` (atau edit `.env` yang sudah ada)
   - Pastikan `DATABASE_URL` dan `GOOGLE_CLIENT_ID` sudah benar.
3. Jalankan API: `go run cmd/api/main.go`

### Endpoints
- `GET /` - Check status API
- `POST /auth/google` - Verifikasi ID Token Google dan Login/Register
- `GET /me` - Endpoint terproteksi (memerlukan validasi token)