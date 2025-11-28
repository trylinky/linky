import {
  EmailHeader,
  EmailFooter,
  styles,
  Button,
  SignOff,
  Logo,
} from './components';
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

export default function OrganizationInviteEmail({
  inviteUrl,
}: {
  inviteUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Join your team on Linky</Preview>
      <Tailwind>
        <Body style={styles.main}>
          <Container style={styles.container}>
            <Logo />
            <EmailHeader title="Join your team on Linky" />

            <Section>
              <Text style={styles.paragraph}>
                You've been invited to join a team on Linky. To accept the
                invite, click the link below.
              </Text>

              <Button href={inviteUrl}>Accept invite</Button>
              <br />

              <Text style={styles.paragraph}>
                If you weren't expecting to receive this email, please ignore
                it.
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
