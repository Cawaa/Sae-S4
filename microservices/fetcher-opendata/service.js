require('dotenv').config();

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

const openDataRoutes = require('./routes/opendata.routes');

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Le service de fetcher-opendata est operationnel !');
});

// On branche les routes sur le prefixe /api
app.use('/api', openDataRoutes);

app.listen(PORT, () => {
    console.log(`Fetcher demarre sur http://localhost:${PORT}`);
    console.log('-> /api/toilettes');
    console.log('-> /api/parkings');
    console.log('-> /api/composteurs');
});