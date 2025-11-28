import { Heading, Img, Section, Text } from '@react-email/components';
import * as React from 'react';

interface EmailHeaderProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export const EmailHeader = ({
  title,
  subtitle,
  imageUrl,
  imageAlt,
}: EmailHeaderProps) => {
  return (
    <>
      <Heading style={headingLarge}>{title}</Heading>
      {subtitle && <Text style={subtitleText}>{subtitle}</Text>}

      {imageUrl && (
        <Section style={cardSection}>
          <Img
            src={imageUrl}
            width="600"
            height="auto"
            alt={imageAlt || title}
          />
        </Section>
      )}
    </>
  );
};

const headingLarge = {
  fontSize: '34px',
  lineHeight: '1.3',
  fontWeight: '600',
  color: '#111',
  textAlign: 'center' as const,
  margin: '30px 0 10px',
  letterSpacing: '-0.02em',
};

const subtitleText = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#6b7280',
  textAlign: 'center' as const,
  margin: '0 0 30px',
};

const cardSection = {
  margin: '30px 0',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '15px',
};
