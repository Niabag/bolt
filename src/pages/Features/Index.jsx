import './features.scss';

const Features = () => {
  const features = [
    {
      icon: "👥",
      title: "Gestion des Prospects",
      description: "Centralisez tous vos prospects avec un système de suivi avancé et des statuts personnalisables. Suivez l'évolution de chaque relation client et ne manquez jamais une opportunité.",
      benefits: [
        "Capture automatique via QR code",
        "Statuts personnalisables",
        "Historique complet des interactions",
        "Fiches détaillées avec notes"
      ]
    },
    {
      icon: "📄",
      title: "Devis Professionnels",
      description: "Créez des devis élégants avec calculs automatiques et export PDF professionnel. Impressionnez vos clients avec des documents de qualité qui reflètent votre professionnalisme.",
      benefits: [
        "Calcul automatique des totaux et TVA",
        "Export PDF haute qualité",
        "Modèles personnalisables",
        "Suivi des statuts (accepté, en attente, etc.)"
      ]
    },
    {
      icon: "💼",
      title: "Cartes de Visite Numériques",
      description: "Générez des QR codes personnalisés pour capturer automatiquement vos prospects. Une solution moderne qui remplace les cartes de visite traditionnelles et facilite le premier contact.",
      benefits: [
        "QR code personnalisable",
        "Séquences d'actions configurables",
        "Statistiques de scan",
        "Intégration avec votre site web"
      ]
    },
    {
      icon: "📊",
      title: "Analytics Avancés",
      description: "Suivez vos performances avec des tableaux de bord détaillés et des métriques clés. Prenez des décisions éclairées basées sur des données concrètes et optimisez votre stratégie commerciale.",
      benefits: [
        "Tableau de bord en temps réel",
        "Suivi du taux de conversion",
        "Analyse du chiffre d'affaires",
        "Prévisions et tendances"
      ]
    },
    {
      icon: "🔔",
      title: "Notifications Intelligentes",
      description: "Restez informé des opportunités importantes avec des alertes personnalisées. Ne manquez jamais un suivi client important ou une date d'échéance critique.",
      benefits: [
        "Alertes pour les devis en attente",
        "Rappels de suivi client",
        "Notifications de nouveaux prospects",
        "Alertes de performance"
      ]
    },
    {
      icon: "💰",
      title: "Facturation Simplifiée",
      description: "Transformez vos devis en factures en quelques clics et gérez tout votre cycle de vente dans une seule plateforme intégrée.",
      benefits: [
        "Conversion devis en facture",
        "Suivi des paiements",
        "Rappels automatiques",
        "Export comptable"
      ]
    }
  ];

  return (
    <div className="features-page">
      {/* En-tête */}
      <div className="features-header">
        <div className="container">
          <h1>Fonctionnalités</h1>
          <p>Découvrez tous les outils qui font de CRM Pro la solution idéale pour les entrepreneurs et freelances</p>
        </div>
      </div>

      {/* Liste des fonctionnalités */}
      <div className="features-list">
        <div className="container">
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-content">
                <h2>{feature.title}</h2>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-benefits">
                  {feature.benefits.map((benefit, i) => (
                    <div key={i} className="benefit-item">
                      <span className="benefit-check">✓</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="features-cta">
        <div className="container">
          <h2>Prêt à essayer toutes ces fonctionnalités ?</h2>
          <p>Créez votre compte gratuitement et commencez à développer votre business dès aujourd'hui</p>
          <div className="cta-buttons">
            <a href="/register-user" className="btn-primary">🚀 Commencer gratuitement</a>
            <a href="/contact" className="btn-secondary">📞 Contactez-nous</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;