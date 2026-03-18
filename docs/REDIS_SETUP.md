# Redis Setup Guide

Redis is used in MapLeads CRM for:
- **Rate limiting** — per-IP request throttling on all endpoints (auth endpoints: 10 req/15 min; general: configurable)
- **Background job queues** — BullMQ queues for sending emails, WhatsApp messages, and other async tasks
- **Session caching** — optional fast-path lookups

> **Without Redis:** The API starts and works normally. Rate limiting falls back to in-memory (resets on server restart). Background jobs will not run.

---

## Local Development (Windows)

### Option 1 — Memurai (Recommended for Windows)

Memurai is a native Redis-compatible server for Windows, maintained and free for development.

1. Download the installer from https://www.memurai.com/get-memurai
2. Run the installer — it registers Memurai as a Windows service that starts automatically.
3. Verify it's running:
   ```powershell
   redis-cli ping
   # Expected output: PONG
   ```
4. No extra configuration needed. Default port is `6379`.

---

### Option 2 — Redis via WSL 2 (Windows Subsystem for Linux)

Requires WSL 2 already installed (`wsl --install` in an elevated terminal).

```bash
# Inside your WSL terminal (Ubuntu):
sudo apt update && sudo apt install -y redis-server

# Start Redis
sudo service redis-server start

# Verify
redis-cli ping
# Expected: PONG
```

Redis in WSL listens on `127.0.0.1:6379` which is accessible from Windows. This connection works with the default `REDIS_URL=redis://localhost:6379`.

To start Redis automatically on WSL boot, add to `/etc/wsl.conf`:
```ini
[boot]
command = service redis-server start
```

---

### Option 3 — Docker Desktop

```bash
docker run -d --name mapleads-redis -p 6379:6379 redis:7-alpine
```

To persist data across restarts:
```bash
docker run -d --name mapleads-redis -p 6379:6379 \
  -v mapleads_redis_data:/data \
  redis:7-alpine redis-server --appendonly yes
```

---

### Connecting the API (local)

In `apps/api/.env`, set:
```env
REDIS_URL=redis://localhost:6379
```

This is the default — no change needed unless you use a password or non-standard port.

To add a password (optional for local dev):
```env
REDIS_URL=redis://:yourpassword@localhost:6379
```

---

## Production Deployment

### Option A — Upstash Redis (Recommended — serverless, free tier available)

Upstash provides a fully managed Redis with a generous free tier and TLS support.

1. Create a free account at https://upstash.com
2. Click **Create Database** → choose **Redis** → select the region closest to your server
3. Enable **TLS** (required for production)
4. Copy the **Redis URL** from the dashboard — it looks like:
   ```
   rediss://default:YOURPASSWORD@your-endpoint.upstash.io:6380
   ```
   Note: `rediss://` (double-s) means TLS.
5. Set in your production `.env` or environment variables:
   ```env
   REDIS_URL=rediss://default:YOURPASSWORD@your-endpoint.upstash.io:6380
   ```

**Free tier limits:** 10,000 commands/day, 256 MB storage — sufficient for small to medium production workloads.

---

### Option B — Redis Cloud (Redis Inc.)

1. Sign up at https://redis.io/try-free
2. Create a free subscription → create a database
3. Copy the **Public endpoint** and **Password**
4. Set:
   ```env
   REDIS_URL=redis://:YOURPASSWORD@your-endpoint.redis.cloud:PORT
   ```

---

### Option C — Self-hosted on VPS (Ubuntu / Debian)

```bash
sudo apt update && sudo apt install -y redis-server

# Edit config
sudo nano /etc/redis/redis.conf
```

Recommended `redis.conf` changes for production:

```conf
# Bind only to localhost (if API is on the same server)
bind 127.0.0.1

# Set a strong password
requirepass YOUR_STRONG_REDIS_PASSWORD

# Enable persistence
appendonly yes
appendfsync everysec

# Limit memory and set eviction policy
maxmemory 512mb
maxmemory-policy allkeys-lru
```

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test with password
redis-cli -a YOUR_STRONG_REDIS_PASSWORD ping
# Expected: PONG
```

Set in production `.env`:
```env
REDIS_URL=redis://:YOUR_STRONG_REDIS_PASSWORD@127.0.0.1:6379
```

---

### Option D — Managed Redis on Cloud Providers

| Provider | Service | Notes |
|---|---|---|
| AWS | ElastiCache (Redis) | Requires VPC — use private endpoint |
| GCP | Memorystore | Private IP by default |
| Azure | Azure Cache for Redis | Supports TLS on port 6380 |
| Railway | Redis plugin | Easiest for Railway deployments — copy `REDIS_URL` directly |
| Render | Redis service | Free tier available — copy `REDIS_URL` directly |
| Heroku | Heroku Data for Redis | Copy `REDIS_TLS_URL` env var |

For **Railway** and **Render**: copy the `REDIS_URL` they provide directly to your environment variable — it already includes authentication.

---

## Environment Variable Reference

```env
# Format: redis[s]://[:password@]host[:port][/db]
# redis://  — plain TCP (localhost, VPN-secured connections)
# rediss:// — TLS (required for any public internet connection)

# Local (no auth)
REDIS_URL=redis://localhost:6379

# Local (with password)
REDIS_URL=redis://:mypassword@localhost:6379

# Production with TLS (Upstash, Redis Cloud, etc.)
REDIS_URL=rediss://default:PASSWORD@host:PORT

# Different database index (if sharing one Redis instance)
REDIS_URL=redis://localhost:6379/1
```

---

## Verifying Redis is Connected

After setting `REDIS_URL` and restarting the server, you will see in the API logs:

```
[info]: Redis connected
[info]: API server running on port 4000
```

If Redis is **not** available you will see:
```
[warn]: Redis unavailable — background workers disabled
[error]: Redis error: connect ECONNREFUSED 127.0.0.1:6379
```

The API continues to work — rate limiting uses in-memory fallback, but background jobs (email queue) will not process until Redis is available.

---

## Security Checklist (Production)

- [ ] Use a strong random password (`openssl rand -hex 32`)
- [ ] Never expose Redis port (`6379`) publicly — use a firewall or bind to `127.0.0.1`
- [ ] Use TLS (`rediss://`) for any connection over the public internet
- [ ] Set `maxmemory` to prevent unbounded memory growth
- [ ] Rotate the Redis password and update `REDIS_URL` in your deployment environment
