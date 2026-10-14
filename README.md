# 🛡️ Codeward Admin Portal

Internal management and operations dashboard for the Codeward platform.

> [!IMPORTANT]
> **Strictly Private Repository**: This codebase must only be pushed to `https://github.com/kelvinmaina01/codeward-admin.git`.
> 
> For architecture, remote branching rules, API routes, and agent instructions, see:
> 👉 **[AGENT_HANDOVER_GUIDE.md](./AGENT_HANDOVER_GUIDE.md)**

---

## Quick Start

```powershell
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run production build validation
npm run build
```

## Deployment

The app is automatically deployed to **Vercel** via commits to `main`.
- **Framework Preset**: Vite
- **Root Directory**: `./` (empty)
- **Output Directory**: `dist`
