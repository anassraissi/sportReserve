# sportReserve 🗓️🏟️  
**Votre solution intelligente de réservation de locaux sportifs**  
Réservez facilement des **terrains**, **salles de musculation**, **studios** et autres espaces sportifs — en quelques clics.

<p align="center">
  <img src="./docs/images/preview.png" alt="sportReserve preview" width="900" />
</p>

<p align="center">
  <a href="#-français">FR</a> •
  <a href="#-english">EN</a>
</p>

---

# 🇫🇷 Français

## ✨ Pourquoi sportReserve ?
- ⚡ **Réservation instantanée** : disponible 24h/24, simple et rapide  
- 🧾 **Gestion simplifiée** : suivez vos réservations et vos disponibilités  
- 🔒 **Sécurité** : authentification + données protégées  
- 💎 **Expérience moderne** : interface fluide, responsive et élégante  

## ✅ Fonctionnalités (principales)
### Côté utilisateur
- Inscription / connexion (email, et OAuth si activé)
- Parcourir les espaces sportifs (terrains, salles…)
- Réserver un créneau (date/heure)
- Consulter l’historique des réservations
- Notifications (selon configuration)

### Côté admin / gestionnaire
- Gestion des espaces (création, modification, disponibilité)
- Suivi des réservations
- Statistiques / dashboard (selon modules)

## 🧰 Tech Stack
- **Frontend** : React + TypeScript (Vite)
- **UI** : Tailwind CSS + Radix UI (design system moderne)
- **Routing** : react-router-dom
- **Formulaires** : react-hook-form + zod
- **Data fetching** : @tanstack/react-query

## 🗂️ Structure du projet (haut niveau)
- `src/` : application front (React)
- `server/` : backend (dossier présent)
- `public/` : assets publics
- `*.md` : documentation (guides, features, setup, etc.)

## 🚀 Installation & Lancement (dev)

### Prérequis
- Node.js (LTS recommandé)
- npm (ou bun)

### Installer
```bash
npm install
```

### Variables d’environnement
Le projet utilise un fichier `.env` à la racine.  
➡️ Mets à jour tes clés selon ton environnement (API, OAuth, email, etc.).

### Lancer le front
```bash
npm run dev
```

### Lancer front + server (si configuré)
```bash
npm run dev:all
```

## 🖼️ Captures d’écran
Ajoute des images dans `docs/images/` puis référence-les dans cette section.

## 🛣️ Roadmap (optionnel)
- Paiement en ligne
- Gestion d’abonnements / packs
- Pricing selon horaires (heures pleines / creuses)
- Multi-centres / multi-gestionnaires

## 🤝 Contribuer
1. Fork
2. Branche : `feat/ma-feature`
3. Commit & push
4. Pull Request

## 📄 Licence
À définir (MIT conseillé si projet open-source).

---

# 🇬🇧 English

## ✨ Why sportReserve?
- ⚡ **Instant booking**: reserve in a few clicks, available 24/7  
- 🧾 **Simplified management**: keep track of bookings & availability  
- 🔒 **Security first**: authentication + protected data  
- 💎 **Modern UX**: smooth, responsive, stylish interface  

## ✅ Key Features
### User side
- Sign up / sign in (email, and OAuth if enabled)
- Browse sport venues (fields, gym rooms, etc.)
- Book a time slot (date/time)
- Booking history
- Notifications (depending on configuration)

### Admin / manager side
- Manage venues (create/edit availability)
- Monitor bookings
- Analytics / dashboard (depending on modules)

## 🧰 Tech Stack
- **Frontend**: React + TypeScript (Vite)
- **UI**: Tailwind CSS + Radix UI
- **Routing**: react-router-dom
- **Forms**: react-hook-form + zod
- **Data fetching**: @tanstack/react-query

## 🗂️ Project Structure (high level)
- `src/`: frontend app (React)
- `server/`: backend (folder present)
- `public/`: static assets
- `*.md`: documentation (guides, setup, features, etc.)

## 🚀 Getting Started (dev)

### Requirements
- Node.js (LTS recommended)
- npm (or bun)

### Install
```bash
npm install
```

### Environment variables
The project uses a root `.env` file.  
➡️ Update keys based on your setup (API, OAuth, email, etc.).

### Run frontend
```bash
npm run dev
```

### Run frontend + server (if configured)
```bash
npm run dev:all
```

## 🖼️ Screenshots
Place images in `docs/images/` and reference them here.

## 🤝 Contributing
1. Fork the repo
2. Create a branch: `feat/my-feature`
3. Commit & push
4. Open a Pull Request

## 📄 License
To be defined (MIT recommended for open-source).

---

## 📬 Contact
Maintained by **@anassraissi**
