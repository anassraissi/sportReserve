# Guide de démarrage du serveur

## Problème : ERR_CONNECTION_REFUSED

Si vous voyez l'erreur `ERR_CONNECTION_REFUSED`, cela signifie que le serveur backend n'est pas en cours d'exécution.

## Solution 1 : Démarrer avec npm run dev:all (recommandé)

Dans le terminal, à la racine du projet :

```bash
npm run dev:all
```

Cela démarre à la fois le frontend (Vite) et le backend (Express) simultanément.

## Solution 2 : Démarrer séparément

### Terminal 1 - Backend :
```bash
cd server
npm run dev
```

Vous devriez voir :
```
✅ Connected to MongoDB
🚀 Server running on port 5000
📡 Socket.IO server ready
```

### Terminal 2 - Frontend :
```bash
npm run dev
```

## Vérifications

1. **MongoDB doit être en cours d'exécution**
   - Vérifiez que MongoDB est démarré sur `localhost:27017`
   - L'URI dans `.env` est : `mongodb://localhost:27017/flow-forge`

2. **Le port 5000 doit être libre**
   - Si le port est occupé, changez `PORT=5000` dans `server/.env`

3. **Vérifiez les logs du serveur**
   - Le serveur doit afficher "✅ Connected to MongoDB" au démarrage
   - Si vous voyez des erreurs MongoDB, démarrez MongoDB d'abord

## Commandes utiles

- Démarrer tout : `npm run dev:all`
- Backend seul : `cd server && npm run dev`
- Frontend seul : `npm run dev`
- Vérifier le port : `netstat -ano | findstr :5000` (Windows)








