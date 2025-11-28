import { EmailHeader, EmailFooter, styles, Logo, SignOff } from './components';
import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';
import * as React from 'react';

const WelcomeEmail = () => (
  <Html>
    <Head />
    <Preview>Welcome to Linky - The delightfully rich link-in-bio</Preview>
    <Tailwind>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Logo />
          <EmailHeader
            title="Welcome to Linky"
            subtitle="The delightfully rich link-in-bio"
            imageUrl="https://cdn.lin.ky/email-assets/welcome-header.png"
            imageAlt="Welcome to Linky"
          />

          <Section>
            <Text style={styles.paragraph}>Thanks for signing up!</Text>

            <Text style={styles.paragraph}>
              My name is Alex, the founder of Linky. You're now part of a
              growing community of over 3,000 creators who are using Linky to
              power their link-in-bio.
            </Text>

            <Text style={styles.paragraph}>
              To help you get the most out of Linky, here's a few recommended
              first steps:
            </Text>

            <ul style={styles.list}>
              <li style={styles.listItem}>
                <Link href="https://lin.ky/edit" style={styles.link}>
                  Setup your first page
                </Link>
              </li>
              <li style={styles.listItem}>
                Add some integrations (I personally love the Spotify and Threads
                integrations)
              </li>
              <li style={styles.listItem}>Share your linky on your socials!</li>
            </ul>

            <Text style={styles.paragraph}>
              If you have any questions or feedback, feel free to reply to this
              email!
            </Text>

            <SignOff label="Alex" />
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default WelcomeEmail;
