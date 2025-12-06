'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@trylinky/ui';

const landingPageQuestions = [
  {
    question: 'Brauche ich technisches Wissen?',
    answer:
      'Nein, überhaupt nicht. Kiko ist so einfach wie WhatsApp. Du wirst Schritt für Schritt durchgeleitet.',
  },
  {
    question: 'Was kostet Kiko?',
    answer:
      'Du kannst mit einer kostenlosen Basis-Version starten. Für erweiterte Funktionen (wie den Verkauf von Produkten) gibt es faire Abo-Modelle.',
  },
  {
    question: 'Was passiert mit meinen Daten?',
    answer:
      'Deine Daten und die der Kinder sind sicher. Wir hosten auf deutschen Servern und sind 100% DSGVO-konform.',
  },
  {
    question: 'Können Eltern mich einfach so buchen?',
    answer:
      'Nein. Eltern stellen eine Anfrage. Du entscheidest immer selbst, wen du kennenlernen und aufnehmen möchtest.',
  },
  {
    question: 'Ist die Suche für Eltern kostenlos?',
    answer:
      'Ja, Eltern können Kiko komplett kostenlos nutzen, um Betreuungsplätze zu finden.',
  },
];

const pricingQuestions = [
  {
    question: 'Was ist Kiko?',
    answer:
      "Kiko ist deine digitale Visitenkarte und Organisationshilfe. Hier kannst du dich präsentieren, freie Plätze ausschreiben und Anfragen verwalten – alles einfach per Handy.",
  },
  {
    question: 'Gibt es eine jährliche Abrechnung?',
    answer:
      'Ja, wir bieten attraktive Rabatte, wenn du dich für eine jährliche Zahlung entscheidest.',
  },
  {
    question: 'Kann ich Kiko als Großtagespflege nutzen?',
    answer:
      "Ja, absolut. Kiko eignet sich hervorragend für Zusammenschlüsse. Ihr könnt euch gemeinsam präsentieren oder separate Profile erstellen.",
  },
  {
    question: 'Welche Zahlungsmethoden werden akzeptiert?',
    answer:
      'Wir nutzen sicherere Zahlungsanbieter und akzeptieren alle gängigen Kreditkarten, PayPal und Lastschrift.',
  },
];

const generateFaqJsonLd = (
  faqs: {
    question: string;
    answer: string;
  }[]
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq, index) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};

const questionSets: Record<string, typeof landingPageQuestions> = {
  'landing-page': landingPageQuestions,
  pricing: pricingQuestions,
};

export function FrequentlyAskedQuestions({
  questionSet,
}: {
  questionSet: 'landing-page' | 'pricing';
}) {
  const questions = questionSets[questionSet];
  const faqJsonLd = generateFaqJsonLd(questions);

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        {questions.map((question) => {
          return (
            <AccordionItem key={question.question} value={question.question}>
              <AccordionTrigger className="text-lg font-medium">
                {question.question}
              </AccordionTrigger>
              <AccordionContent className="text-lg text-black/60">
                {question.answer}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />
    </>
  );
}
