import { Img, Text } from '@react-email/components';
import * as React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  children?: React.ReactNode;
}

export const Card = ({ title, subtitle, logoUrl, children }: CardProps) => {
  return (
    <div style={card}>
      {logoUrl && (
        <Img src={logoUrl} width="48" height="48" alt="" style={logo} />
      )}
      {title && <Text style={cardTitle}>{title}</Text>}
      {subtitle && <Text style={cardSubtitle}>{subtitle}</Text>}
      {children}
    </div>
  );
};

const card = {
  padding: '20px',
  borderRadius: '10px',
  border: '1px solid #eaeaea',
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
};

const logo = {
  borderRadius: '50%',
  margin: '0 auto',
  display: 'block',
  backgroundColor: '#000',
};

const cardTitle = {
  fontSize: '18px',
  fontWeight: '600',
  margin: '10px 0 2px',
  color: '#111',
};

const cardSubtitle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};
