import { Link } from 'react-router-dom';
import './Error.scss';

function ErrorPage() {
  return (
    <div className="error-page">
      <div className="error-container">
        <p className="error-code">404</p>
        <p className="error-message">Oups ! La page que vous demandez n'existe pas.</p>
        <Link className="error-link" to="/home">
          Retourner sur la page d'accueil
        </Link>
      </div>
    </div>
  );
}

export default ErrorPage;
