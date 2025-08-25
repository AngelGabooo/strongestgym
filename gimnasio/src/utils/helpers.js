export const calculateSubscriptionStatus = (expirationDate) => {
  const now = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'expired';
  if (diffDays <= 3) return 'expiring';
  return 'active';
};

export const calculateExpirationDate = (paymentDate, subscriptionType, visitDays = 1) => {
  const date = new Date(paymentDate);
  if (subscriptionType === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setDate(date.getDate() + parseInt(visitDays));
  }
  return date.toISOString();
};

export const getLocalTimestamp = () => {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  const second = parts.find(p => p.type === 'second').value;
  const millisecond = parts.find(p => p.type === 'fractionalSecond').value.padStart(3, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}`;
};  