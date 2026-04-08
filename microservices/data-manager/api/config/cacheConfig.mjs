export const ALLOWED_TYPES = ['toilettes', 'parkings', 'composteurs'];

// Retourne le TTL en secondes pour un type de dataset donné, en utilisant les variables d'environnement ou des valeurs par défaut
export function getTtlSeconds(type) {
  const defaults = {
    toilettes: Number(process.env.TOILETTES_TTL_SECONDS || 86400),
    composteurs: Number(process.env.COMPOSTEURS_TTL_SECONDS || 86400),
    parkings: Number(process.env.PARKINGS_TTL_SECONDS || 300)
  };

  return defaults[type] || 3600;
}
