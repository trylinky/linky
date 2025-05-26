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
Hey there,\n\nIt's Alex, the founder of Linky.\n\nI know - nobody loves these emails, but I wanted to give you a quick heads-up: your trial has officially ended.\n\nWe've moved you to our free plan, and don't worry - all of your links and pages are still there.\n\nIf you're ready to upgrade to Premium and unlock all of features, then you can do so here:\n\nhttps://lin.ky/i/pricing.\n\nThanks again for trying Linky, and if there's anything you need, just reply.\n\nBest,\nAlex\nFounder of Linky
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
                As you haven't extended your plan, your account has been moved
                to our free plan.
              </Text>

              <Text style={styles.paragraph}>
                Login to the Linky dashboard at any point to choose a new plan,
                and carry on where you left off!
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
