import { EmailHeader, EmailFooter, styles, Logo, SignOff } from './components';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';
import * as React from 'react';

export default function SubscriptionCancelledEmail() {
  return (
    <Html>
      <Head />
      <Preview>Your Linky subscription has been cancelled</Preview>
      <Tailwind>
        <Body style={styles.main}>
          <Container style={styles.container}>
            <Logo />
            <EmailHeader
              title="Subscription cancelled"
              subtitle="We're sorry to see you go"
            />

            <Section>
              <Text style={styles.paragraph}>
                This email is to confirm that your subscription has been
                cancelled.
              </Text>

              <Text style={styles.paragraph}>
                If you would like to re-subscribe, you can do so at any time via
                the Linky app.
              </Text>

              <Text style={styles.paragraph}>
                If you have any questions, or if you don't think this was
                intentional, please reply to this email and we'll be happy to
                help.
              </Text>
              <SignOff />
            </Section>

            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
