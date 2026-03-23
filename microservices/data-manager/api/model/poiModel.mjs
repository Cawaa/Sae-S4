import mongoose from 'mongoose';

const poiSchema = new mongoose.Schema({
    type: { type: String, required: true, index: true }, // ex: 'toilettes', 'parkings', 'composteurs'
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // Les données brutes (JSON)
    lastUpdate: { type: Date, default: Date.now }
});

const POIModel = mongoose.model('POI', poiSchema);

export default POIModel;
