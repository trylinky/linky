import { EmailFooter, EmailHeader, styles, Logo } from './components';
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface MagicLinkEmailProps {
  url?: string;
}

const MagicLinkEmail = ({ url }: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Body style={styles.main}>
      <Preview>Your login code for Linky</Preview>
      <Container style={styles.container}>
        <Logo />

        <EmailHeader
          title="Your login code for Linky"
          subtitle="Click below to login"
        />
        <Section style={buttonContainer}>
          <Button style={button} href={url}>
            Login to Linky
          </Button>
        </Section>
        <Text style={styles.paragraph}>
          This link and code will only be valid for the next 5 minutes.
        </Text>

        <EmailFooter />
      </Container>
    </Body>
  </Html>
);

export default MagicLinkEmail;

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
};

const buttonContainer = {
  padding: '27px 0 27px',
};

const button = {
  backgroundColor: '#111',
  borderRadius: '8px',
  fontWeight: '600',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '11px 23px',
};
