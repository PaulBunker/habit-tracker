# Local Domain Setup Guide

This guide explains how to access the Habit Tracker app using custom local domains instead of `localhost:PORT`.

## Why Use Local Domains?

- **Cleaner URLs**: Access via `http://habbits.localhost` instead of `http://localhost:5173`
- **Environment separation**: Use different domains for production vs development
- **Realistic testing**: Test with domain-like URLs that better simulate production

## Prerequisites

1. **Caddy** - A modern web server with automatic HTTPS
   ```bash
   brew install caddy
   ```

2. **Root access** - Required to modify `/etc/hosts`

## Setup Steps

### 1. Add entries to `/etc/hosts`

Edit your hosts file to map custom domains to localhost:

```bash
sudo nano /etc/hosts
```

Add these lines:

```
127.0.0.1 habbits.localhost
127.0.0.1 dev.habbits.localhost
```

Save and flush the DNS cache:

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

### 2. Configure the environment variable

Add your custom hosts to the appropriate `.env` file:

**`.env.development`** (for `npm run dev`):
```
VITE_ALLOWED_HOSTS=dev.habbits.localhost
```

**`.env.production`** (for `npm run start:prod`):
```
VITE_ALLOWED_HOSTS=habbits.localhost
```

You can specify multiple hosts separated by commas:
```
VITE_ALLOWED_HOSTS=habbits.localhost,dev.habbits.localhost
```

### 3. Create a Caddyfile

Copy the example Caddyfile from the repo root:

```bash
cp Caddyfile.example Caddyfile
```

Or create your own `Caddyfile`:

```
http://habbits.localhost {
    reverse_proxy localhost:5173
}

http://dev.habbits.localhost {
    reverse_proxy localhost:5174
}
```

### 4. Start Caddy

Run Caddy with your configuration:

```bash
caddy start --config ./Caddyfile
```

To stop Caddy:

```bash
caddy stop
```

### 5. Start the app

```bash
# Development mode (port 5174)
npm run dev

# Production mode (port 5173)
npm run start:prod
```

### 6. Access via custom domains

- **Production**: http://habbits.localhost
- **Development**: http://dev.habbits.localhost

## Domain Naming Recommendations

Use `.localhost` TLD for local development:

| TLD | Recommendation |
|-----|----------------|
| `.localhost` | Recommended - works in all browsers |
| `.local` | Works but may conflict with mDNS/Bonjour |
| `.dev` | Avoid - browsers force HTTPS (Google owns this TLD) |
| `.test` | Good alternative to .localhost |

## Troubleshooting

See [TROUBLESHOOTING-LOCAL-DOMAINS.md](./TROUBLESHOOTING-LOCAL-DOMAINS.md) for common issues.

### Quick checks

```bash
# Verify hosts file entries
cat /etc/hosts | grep habbits

# Check if Caddy is running on port 80
lsof -i :80 | grep LISTEN

# Check if Vite servers are running
lsof -i :5173 -i :5174 | grep LISTEN

# Test the reverse proxy
curl -I http://habbits.localhost
curl -I http://dev.habbits.localhost
```

### Common issues

1. **"Site can't be reached"** - Check that Caddy is running and listening on port 80
2. **"Invalid Host header"** - Ensure `VITE_ALLOWED_HOSTS` includes your custom domain
3. **"Connection refused"** - Start the Vite dev server (`npm run dev` or `npm run start:prod`)
