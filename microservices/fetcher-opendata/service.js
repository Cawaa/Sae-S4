const express = require('express')

const app = express()
const PORT = 3001


app.use(express.json()) // Utilisation d'un middleware pour parser le JSON

app.get('/', (req, res) =>{
    res.send("Le service de fetcher-opendata est opérationnel !")
})

app.get('/api/toilettes', async (req, res) => {
    try {

        const urlToilettes = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_toilettes-publiques-nantes-metropole/records?limit=20'
        const reponse = await fetch(urlToilettes)

        const data = await reponse.json()

        // renvoie les données au format JSON
        res.status(200).json(data)

    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error)
        res.status(500).json({ error: 'Erreur lors de la récupération des données' })
    }
    
})

// Démarrage du serveur sur le port spécifié
app.listen(PORT, () => {
    console.log(`Fetcher démarré sur http://localhost:${PORT}`);
});