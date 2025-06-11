import React from 'react';
import QRCode from 'react-qr-code';
import './QRCodeDisplay.scss';

const QRCodeDisplay = ({ value, title, description, size = 200 }) => {
  if (!value) return null;
  
  return (
    <div className="qr-code-display">
      <div className="qr-code-container">
        <div className="qr-code-wrapper">
          <QRCode 
            value={value}
            size={size}
            bgColor="#FFFFFF"
            fgColor="#1f2937"
            level="M"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
        <div className="qr-code-info">
          <h3>{title || "Scannez ce QR code pour me contacter"}</h3>
          <p>{description || "Ou téléchargez ma carte de visite numérique"}</p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;