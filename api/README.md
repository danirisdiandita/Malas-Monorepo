# API Service

Go-based API using [Chi](https://github.com/go-chi/chi) and [Ent ORM](https://entgo.io/).

## Prasyarat (Prerequisites)

1. **Go 1.21+**
2. **PostgreSQL** (Sudah berjalan dan dapat diakses)

## Persiapan Ekosistem (Setup)

Salin file `.env.example` menjadi `.env` dan sesuaikan nilainya:

```bash
cp .env.example .env
```

Pastikan `DATABASE_URL` diatur dengan benar:
`postgres://user:password@localhost:5432/dbname?sslmode=disable`

## Database Migration

Kami menggunakan migrasi SQL berversi yang disimpan di `ent/migrate/migrations/`. API tidak mengubah skema database saat startup; jalankan migrasi secara eksplisit menggunakan Moon sebelum menjalankan API.

### 1. Jalankan Migrasi (Migration Up)
Perintah ini akan menyinkronkan skema database dengan kode `ent/schema`.

```bash
moon run api:migrate-up
```

Perintah ini aman dijalankan berulang kali. Hanya file migrasi yang belum tercatat di tabel `schema_migrations` yang akan diterapkan. Gunakan perintah yang sama di production saat deployment:

```bash
moon run api:migrate-up
```

### 2. Jalankan Migrasi dengan Seeding
Jika Anda ingin mengisi database dengan data awal (seed) setelah migrasi:

```bash
moon run api:migrate-up-seed
```

### 3. Generate Kode Ent
Jika Anda mengubah file di `ent/schema/*`, jalankan perintah ini untuk memperbarui kode yang dihasilkan:

```bash
moon run api:generate
```

Setelah mengubah schema, buat file migrasi SQL baru di `ent/migrate/migrations/` dan beri nama berurutan, misalnya `000002_add_foo.sql`. Jangan mengedit migrasi yang sudah pernah dijalankan di environment mana pun.

## Menjalankan API (Run API)

Untuk menjalankan server dalam mode pengembangan:

```bash
moon run api:dev
```

Server akan berjalan di `http://localhost:8080`.
