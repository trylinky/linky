import { Img, Text } from '@react-email/components';
import * as React from 'react';

interface ContentCardProps {
  text: string;
  subtext?: string;
  iconUrl?: string;
}

export const ContentCard = ({ text, subtext, iconUrl }: ContentCardProps) => {
  return (
    <div style={contentCard}>
      {iconUrl && (
        <div style={contentCardIconContainer}>
          <Img src={iconUrl} width="24" height="24" alt="" />
        </div>
      )}
      <Text style={contentCardText}>{text}</Text>
      {subtext && <Text style={contentCardSubtext}>{subtext}</Text>}
    </div>
  );
};

const contentCard = {
  display: 'flex',
  padding: '15px',
  borderRadius: '10px',
  border: '1px solid #eaeaea',
  backgroundColor: '#ffffff',
  alignItems: 'center',
};

const contentCardIconContainer = {
  marginRight: '12px',
};

const contentCardText = {
  fontSize: '16px',
  fontWeight: '500',
  color: '#111',
  margin: '0',
};

const contentCardSubtext = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 0 auto',
};
