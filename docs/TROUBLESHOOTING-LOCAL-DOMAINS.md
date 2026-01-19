# Troubleshooting: Local Domain Setup (habbits / habbits.dev)

## Goal
Access local servers without ports:
- `http://habbits` → Production (port 5173)
- `http://habbits.dev` → Development (port 5174)

## Current Setup

### 1. Caddy Reverse Proxy
**Status: Working**

Config file: `/Users/paulbunker/claude/Caddyfile`
```
http://habbits {
    reverse_proxy localhost:5173
}

http://habbits.dev {
    reverse_proxy localhost:5174
}
```

Caddy is running on port 80 and correctly proxies requests:
```bash
# This works:
curl -H "Host: habbits.dev" http://127.0.0.1:80  # Returns 200 OK
curl http://habbits.dev  # Returns 200 OK (from CLI)
```

### 2. Vite Configuration
**Status: Updated**

Added `allowedHosts` to `packages/frontend/vite.config.ts`:
```typescript
server: {
  port: VITE_PORT,
  allowedHosts: ['localhost', 'habbits', 'habbits.dev'],
  // ...
}
```

### 3. Hosts File
**Status: Entries added but not resolving in browsers**

Added to `/etc/hosts`:
```
127.0.0.1 habbits
127.0.0.1 habbits.dev
```

DNS cache flushed:
```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

## Problem

| Test Method | habbits.dev | Result |
|-------------|-------------|--------|
| curl (CLI) | ✅ Works | 200 OK |
| Playwright browser | ❌ Fails | ERR_CONNECTION_REFUSED |
| Safari/Chrome | ❌ Fails | Site can't be reached |

### Possible Causes

1. **Browser DNS caching** - Browsers cache DNS independently of system cache
2. **`.dev` TLD is HSTS preloaded** - Chrome/Firefox force HTTPS for all `.dev` domains (since 2017, Google owns `.dev`)
3. **Browser security policies** - Some browsers ignore /etc/hosts for certain TLDs
4. **Proxy/VPN interference** - Network configuration bypassing local hosts file

## Likely Root Cause: `.dev` TLD

The `.dev` TLD is owned by Google and is on the HSTS preload list. **All major browsers force HTTPS for `.dev` domains**, which means:
- `http://habbits.dev` gets upgraded to `https://habbits.dev`
- Caddy is only listening on HTTP (port 80), not HTTPS (port 443)
- Connection fails

## Solutions to Try

### Option A: Use a different TLD (Recommended)
Use `.localhost` or `.local` instead of `.dev`:
```
127.0.0.1 habbits.localhost
127.0.0.1 dev.habbits.localhost
```

Update Caddyfile:
```
http://habbits.localhost {
    reverse_proxy localhost:5173
}

http://dev.habbits.localhost {
    reverse_proxy localhost:5174
}
```

### Option B: Enable HTTPS in Caddy
Let Caddy generate self-signed certs:
```
habbits.dev {
    tls internal
    reverse_proxy localhost:5173
}
```

Then trust the Caddy root CA in your system keychain.

### Option C: Use port-based URLs (simplest)
Skip the reverse proxy entirely:
- `http://localhost:5173` → Production
- `http://localhost:5174` → Development

## Commands Reference

```bash
# Check Caddy status
lsof -i :80 | grep LISTEN

# Check servers
lsof -i :5173 -i :5174 | grep LISTEN

# Test with curl
curl -I http://habbits.dev

# Restart Caddy
caddy stop && caddy start --config /Users/paulbunker/claude/Caddyfile

# Flush DNS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# View hosts file
cat /etc/hosts | grep habbits
```
