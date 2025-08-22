import { useState } from 'react';
import QRScanner from '../organisms/QRScanner';
import PropTypes from 'prop-types';

const Scanner = ({ className = '', ...props }) => {
  const handleScan = (clientData) => {
    console.log('Cliente escaneado:', clientData);
  };

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/20 p-6 ${className}`} 
      {...props}
    >
      <QRScanner onScan={handleScan} />
    </div>
  );
};

Scanner.propTypes = {
  className: PropTypes.string,
};

export default Scanner; 