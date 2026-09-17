import { EmailHeader, EmailFooter, styles, SignOff, Logo } from './components';
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

export const TrialFinishedEmailText = `
Hey there,\n\nIt's Alex, the founder of Linky.\n\nYour Premium trial has ended and your account is now on Free. Your page is still live and nothing has been removed.\n\nOn Free you have one page with up to five blocks. Analytics, private pages, the verified badge and custom domains are paused until you upgrade.\n\nUpgrade any time from the editor: https://lin.ky/edit?showBilling=true\n\nThanks for trying Linky. If anything's unclear, just reply.\n\nBest,\nAlex\nFounder of Linky
`;

export default function TrialFinishedEmail() {
  return (
    <Html>
      <Head />
      <Preview>Your Linky Premium trial has ended</Preview>
      <Tailwind>
        <Body style={styles.main}>
          <Container style={styles.container}>
            <Logo />
            <EmailHeader
              title="Your trial has ended"
              subtitle="We've moved you to our free plan"
            />

            <Section>
              <Text style={styles.paragraph}>
                Your Premium trial has ended and your account is now on Free.
                Your page is still live and nothing has been removed.
              </Text>

              <Text style={styles.paragraph}>
                On Free you have one page with up to five blocks. Analytics,
                private pages, the verified badge and custom domains are paused
                until you upgrade.
              </Text>

              <Text style={styles.paragraph}>
                Upgrade any time from the editor:
                https://lin.ky/edit?showBilling=true
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
