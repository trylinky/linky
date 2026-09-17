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
                Your Premium trial ends in 3 days. If you don&apos;t add a card
                before then, your account moves to Free and these pause:
              </Text>
              <Text style={styles.paragraph}>
                • Analytics
                <br />• Unlimited pages and blocks (Free is one page, five
                blocks)
                <br />• Private pages
                <br />• Your verified badge and custom domain
              </Text>
              <Text style={styles.paragraph}>
                Your page stays live either way. To keep Premium, add a card
                from the billing screen: https://lin.ky/edit?showBilling=true
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
