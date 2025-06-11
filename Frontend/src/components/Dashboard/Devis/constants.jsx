export const DEFAULT_DEVIS = {
  logoUrl: "",
  title: "Modèle de devis",
  description: "Description de l'article",
  amount: 0,
  clientId: "",
  entrepriseName: "Nom de l’entreprise",
  entrepriseAddress: "123 Rue Exemple",
  entrepriseCity: "75000 Paris",
  entreprisePhone: "01 23 45 67 89",
  entrepriseEmail: "contact@entreprise.com",
  dateDevis: new Date().toISOString().slice(0, 10),
  dateValidite: "",
  devisNumber: `DEV-${Date.now()}`,
  articles: [
    {
      description: "Article 1",
      unitPrice: "0",
      quantity: "1",
      unit: "u",
      tvaRate: "20" // ✅ TVA par article (string pour select)
    }
  ]
};
