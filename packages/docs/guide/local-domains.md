# Local Domain Setup

Access the Habit Tracker app using custom local domains instead of `localhost:PORT`.

## Why Use Local Domains?

- **Cleaner URLs**: `http://habits.localhost` instead of `http://localhost:5173`
- **Environment separation**: Different domains for production vs development
- **Realistic testing**: URLs that better simulate production

## Quick Setup

::: tip Source of Truth
The `Caddyfile` in the repo root contains the authoritative setup instructions.
:::

### 1. Install Caddy

```bash
brew install caddy
```

### 2. Configure /etc/hosts

```bash
sudo nano /etc/hosts
```

Add:

```
127.0.0.1 habits.localhost dev.habits.localhost
```

Flush DNS cache:

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

### 3. Configure VITE_ALLOWED_HOSTS

Add to your `.env` files:

**`.env.development`**:
```
VITE_ALLOWED_HOSTS=dev.habits.localhost
```

**`.env.production`**:
```
VITE_ALLOWED_HOSTS=habits.localhost
```

For multiple hosts, separate with commas:
```
VITE_ALLOWED_HOSTS=habits.localhost,dev.habits.localhost
```

### 4. Start Caddy

```bash
caddy run --config Caddyfile
```

### 5. Access the App

| Mode | URL |
|------|-----|
| Production | http://habits.localhost |
| Development | http://dev.habits.localhost |

## TLD Recommendations

| TLD | Recommendation |
|-----|----------------|
| `.localhost` | **Recommended** - works in all browsers |
| `.test` | Good alternative |
| `.local` | May conflict with mDNS/Bonjour |
| `.dev` | **Avoid** - browsers force HTTPS |

::: warning .dev TLD
The `.dev` TLD is owned by Google and is on the HSTS preload list. All major browsers force HTTPS for `.dev` domains, which causes connection failures with HTTP-only local setups.
:::

## Troubleshooting

### Quick Checks

```bash
# Verify hosts file entries
grep habits /etc/hosts

# Check if Caddy is running on port 80
lsof -i :80 | grep LISTEN

# Check if Vite servers are running
lsof -i :5173 -i :5174 | grep LISTEN

# Test the reverse proxy
curl -I http://habits.localhost
```

### Common Issues

| Error | Cause | Fix |
|-------|-------|-----|
| "Site can't be reached" | Caddy not running | Start Caddy: `caddy run --config Caddyfile` |
| "Invalid Host header" | Vite rejecting host | Add domain to `VITE_ALLOWED_HOSTS` |
| "Connection refused" | Vite server not running | Start with `npm run dev` or `npm run start:prod` |

### Flush DNS Cache

If domains aren't resolving after editing `/etc/hosts`:

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

## Commands Reference

```bash
# Start Caddy
caddy run --config Caddyfile

# Stop Caddy
caddy stop

# Check Caddy status
lsof -i :80 | grep LISTEN

# Restart Caddy
caddy stop && caddy start --config Caddyfile
```
