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

Kami menggunakan **Ent** yang mendukung auto-migration. Anda dapat menjalankan migrasi secara eksplisit menggunakan Makefile:

### 1. Jalankan Migrasi (Migration Up)
Perintah ini akan menyinkronkan skema database dengan kode `ent/schema`.

```bash
make migrate-up
```

### 2. Jalankan Migrasi dengan Seeding
Jika Anda ingin mengisi database dengan data awal (seed) setelah migrasi:

```bash
make migrate-up-seed
```

### 3. Generate Skema Ent
Jika Anda mengubah file di `ent/schema/*`, jalankan perintah ini untuk memperbarui kode yang dihasilkan:

```bash
make generate
```

## Menjalankan API (Run API)

Untuk menjalankan server dalam mode pengembangan:

```bash
make dev
```

Server akan berjalan di `http://localhost:8080`.