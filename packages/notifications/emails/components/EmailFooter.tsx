import {
  Hr,
  Link,
  Section,
  Text,
  Img,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

const socialLinks: SocialLink[] = [
  {
    href: 'https://x.com/trylinky',
    icon: 'https://cdn.lin.ky/email-assets/icons/x.png',
    alt: 'Twitter',
  },
  {
    href: 'https://instagram.com/trylinky',
    icon: 'https://cdn.lin.ky/email-assets/icons/instagram.png',
    alt: 'Instagram',
  },
  {
    href: 'https://linkedin.com/company/trylinky',
    icon: 'https://cdn.lin.ky/email-assets/icons/linkedin.png',
    alt: 'LinkedIn',
  },
];

interface SocialLink {
  href: string;
  icon: string;
  alt: string;
}

export const EmailFooter = () => {
  return (
    <>
      <Hr style={hr} />
      <Section style={footer}>
        {socialLinks.length > 0 && (
          <Row>
            {socialLinks.map((link, index) => (
              <Column key={index} style={socialIconColumn}>
                <Link href={link.href}>
                  <Img
                    src={link.icon}
                    width="24"
                    height="24"
                    alt={link.alt}
                    style={socialIcon}
                  />
                </Link>
              </Column>
            ))}
          </Row>
        )}

        <Text style={copyright}>Linky 2025</Text>
        <Text style={footerText}>
          123 City Road, London, United Kingdom, EC1V 2NX
        </Text>
      </Section>
    </>
  );
};

const hr = {
  borderColor: '#eaeaea',
  margin: '26px 0',
};

const footer = {
  textAlign: 'center' as const,
};

const socialIconColumn = {
  width: '24px',
  display: 'inline-block',
  margin: '0 10px',
};

const socialIcon = {
  width: '24px',
  height: '24px',
};

const copyright = {
  fontSize: '14px',
  color: '#9ca3af',
  margin: '16px 0 8px',
};

const footerText = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#9ca3af',
  margin: '0',
};
