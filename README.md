# Nantes App

Application mobile de navigation urbaine intelligente pour la ville de Nantes.
Optimise les trajets en intégrant les services de la ville (composteurs, points de collecte, toilettes publiques, parkings…).

## Structure du projet

```
nantes-urban-app/
├── Microservices/        # Serveur Node.js (API REST + algorithmes)
├── database/       # Schémas et migrations BDD
└── docs/           # Documentation technique
```

## Comment récupérer le projet et travailler dessus 

### Tout d'abord cloner le projet si cela n'est pas déjà fait

1. **Récupérer la mise à jour :**
   ```bash
   git pull
   ```

2. **Aller dans le bon dossier :** *(par exemple le microservice fetcher-opendata)*
   ```bash
   cd Microservices/fetcher-opendata
   ```

3. **Installer les dépendances :**
   ```bash
   npm install
   ```
 

4. **Lancer le serveur :**
   ```bash
   npm run dev
   ```

