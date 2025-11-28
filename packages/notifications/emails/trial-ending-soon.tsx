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

export default function TrialEndingSoonEmail() {
  return (
    <Html>
      <Head />
      <Preview>Your Premium Linky trial is ending soon</Preview>
      <Tailwind>
        <Body style={styles.main}>
          <Container style={styles.container}>
            <Logo />
            <EmailHeader
              title="Your trial is ending soon"
              subtitle="You've got 3 days left of Linky Premium"
            />

            <Section>
              <Text style={styles.paragraph}>
                How are you finding it so far? If there's anything we can do to
                help you get your page setup, feel free to reply to this email
                and we'll reach out as soon as possible.
              </Text>

              <Text style={styles.paragraph}>
                Please note, that if you don't extend your trial within 3 days
                you will lose access to your Linky Premium features.
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
