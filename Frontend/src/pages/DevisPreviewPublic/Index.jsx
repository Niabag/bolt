import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_ENDPOINTS, apiRequest } from '../../config/api';
import './devisPreviewPublic.scss';

const DevisPreviewPublic = () => {
  const { devisId } = useParams();
  const [devis, setDevis] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevis = async () => {
      try {
        const data = await apiRequest(API_ENDPOINTS.DEVIS.PUBLIC(devisId));
        if (data && data.devis) {
          setDevis(data.devis);
        } else {
          setError('Devis introuvable');
        }
      } catch (err) {
        console.error(err);
        setError("Erreur lors de la récupération du devis");
      } finally {
        setLoading(false);
      }
    };
    if (devisId) {
      fetchDevis();
    }
  }, [devisId]);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '');

  if (loading) return <div className="public-devis-preview">Chargement...</div>;
  if (error) return <div className="public-devis-preview">{error}</div>;
  if (!devis) return null;

  const client = devis.clientId || {};
  const lignes = Array.isArray(devis.articles) ? devis.articles : [];
  const totalHT = lignes.reduce((sum, a) => sum + (parseFloat(a.unitPrice || 0) * parseFloat(a.quantity || 0)), 0);
  const totalTVA = lignes.reduce((sum, a) => sum + (parseFloat(a.unitPrice || 0) * parseFloat(a.quantity || 0)) * (parseFloat(a.tvaRate || 0) / 100), 0);
  const totalTTC = totalHT + totalTVA;

  return (
    <div className="public-devis-preview">
      <h1>Devis</h1>
      <h2>{devis.title}</h2>
      <p>Date : {formatDate(devis.dateDevis)}</p>
      <p>Validité : {formatDate(devis.dateValidite)}</p>
      <h3>Client</h3>
      <p>{client.name}</p>
      {client.email && <p>{client.email}</p>}
      {client.phone && <p>{client.phone}</p>}
      {client.address && (
        <p>
          {client.address} {client.postalCode} {client.city}
        </p>
      )}
      <table className="articles-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qté</th>
            <th>PU HT</th>
            <th>TVA</th>
            <th>Total HT</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((art, i) => {
            const price = parseFloat(art.unitPrice || 0);
            const qty = parseFloat(art.quantity || 0);
            const lineTotal = price * qty;
            return (
              <tr key={i}>
                <td>{art.description}</td>
                <td>{qty}</td>
                <td>{price.toFixed(2)} €</td>
                <td>{art.tvaRate || 0}%</td>
                <td>{lineTotal.toFixed(2)} €</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="totals">
        <p>Total HT : {totalHT.toFixed(2)} €</p>
        <p>Total TVA : {totalTVA.toFixed(2)} €</p>
        <p><strong>Total TTC : {totalTTC.toFixed(2)} €</strong></p>
      </div>
    </div>
  );
};

export default DevisPreviewPublic;
