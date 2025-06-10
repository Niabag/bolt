export const calculateTTC = (devis) => {
  if (!devis || !Array.isArray(devis.articles)) return 0;

  return devis.articles.reduce((total, article) => {
    const price = parseFloat(article.unitPrice || 0);
    const qty = parseFloat(article.quantity || 0);
    const tva = parseFloat(article.tvaRate || 0);

    if (isNaN(price) || isNaN(qty) || isNaN(tva)) return total;

    const ht = price * qty;
    return total + ht + (ht * tva / 100);
  }, 0);
};
