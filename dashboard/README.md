# Dashboard → WAWI Integration

Dieses Dashboard spricht ausschließlich mit dem WAWI-Backend (InvenTree-basiert).

## Env Variablen

- `VITE_API_BASE_URL` – z. B. `https://wawi-new.onrender.com`
- `VITE_WAWI_API_TOKEN` – Service-/API-Token für das WAWI (`Authorization: Token <TOKEN>`)

## Kurztest (curl)

```bash
curl -H "Authorization: Token <TOKEN>" https://wawi-new.onrender.com/api/user/
```

## Dev-Hinweis

In `dev` zeigt eine kleine Info-Leiste im Dashboard, ob Base-URL und Token gesetzt sind und kann Health/Me testen.
