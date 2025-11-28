'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@trylinky/ui';

const landingPageQuestions = [
  {
    question: 'What is Linky?',
    answer:
      "Linky is a single link that you can use to house all the links to your social media profiles, websites, and other content. It's a great way to share all your content in one place, whether it be your favourite songs on Spotify, or a link to your latest products.",
  },
  {
    question: 'What does link in bio mean?',
    answer:
      "A link in bio is a single link that you can use to house all of the links that you want to share with your audience. Whether you're a creator sharing links to your social media profiles, or a business sharing links to your products and services, a link in bio is a great way to share all your content in one place.",
  },
  {
    question: 'Why do I need Linky?',
    answer:
      'Linky is a singular link solution designed to bridge your audience to every aspect of your digital presence—encompassing who you are, what you do, and what matters to you. It simplifies the sharing process by consolidating multiple links into one, ensuring that your followers, visitors, and customers can effortlessly access all they need in a single location.',
  },
  {
    question: 'Is it free?',
    answer:
      'We stopped offering free pages earlier this year, however our pricing starts from only $4 per month.',
  },
  {
    question: 'Can I use my own domain?',
    answer:
      "We're currently rolling out custom domains to a select group of users. If you're interested in trying it out, please reach out to us.",
  },
];

const pricingQuestions = [
  {
    question: 'What is Linky?',
    answer:
      "Linky is a single link that you can use to house all the links to your social media profiles, websites, and other content. It's a great way to share all your content in one place, whether it be your favourite songs on Spotify, or a link to your latest products.",
  },
  {
    question: 'Do you offer yearly pricing?',
    answer:
      'For teams that require a more tailored solution, we are happy to offer a more custom billing solution. Please reach out to us to discuss your needs.',
  },
  {
    question: 'I am an agency, can I use Linky for my clients?',
    answer:
      "Yes, you can use Linky for your clients. You would be best suited for the team plan where you can invite your teammates to manage your clients' pages. We also offer the ability to create separate team spaces for each of your clients, where you can manage their pages. Please reach out to us to discuss your needs.",
  },
  {
    question: 'What methods of payment do you support?',
    answer:
      'We use Stripe as our payment processor. They support all major credit cards, as well as a number of other country specific payment methods.',
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
