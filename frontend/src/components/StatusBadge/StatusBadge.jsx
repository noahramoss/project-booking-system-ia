import React from 'react';
import styles from './StatusBadge.module.css';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: { label: 'Pendiente', className: styles.pending },
    CONFIRMED: { label: 'Confirmada', className: styles.confirmed },
    CANCELLED: { label: 'Cancelada', className: styles.cancelled },
  };

  const config = statusConfig[status] || { label: status, className: '' };

  return (
    <span className={`${styles.badge} ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
