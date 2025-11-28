import { Img, Text } from '@react-email/components';
import * as React from 'react';

interface LinkCardProps {
  title: string;
  subtitle?: string;
  iconUrl?: string;
}

export const LinkCard = ({ title, subtitle, iconUrl }: LinkCardProps) => {
  return (
    <div style={linkCard}>
      {iconUrl && (
        <div style={linkCardIconContainer}>
          <Img src={iconUrl} width="24" height="24" alt="" />
        </div>
      )}
      <div style={linkCardContent}>
        <Text style={linkCardTitle}>{title}</Text>
        {subtitle && <Text style={linkCardSubtitle}>{subtitle}</Text>}
      </div>
    </div>
  );
};

const linkCard = {
  display: 'flex',
  padding: '15px',
  borderRadius: '10px',
  border: '1px solid #eaeaea',
  backgroundColor: '#111',
  alignItems: 'center',
  position: 'relative' as const,
};

const linkCardIconContainer = {
  marginRight: '12px',
};

const linkCardContent = {
  flex: '1',
};

const linkCardTitle = {
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 2px',
  color: '#ffffff',
};

const linkCardSubtitle = {
  fontSize: '14px',
  color: '#a1a1aa',
  margin: '0',
};
