import { MarketingContainer } from '@/components/marketing-container';
import { cn } from '@trylinky/ui';
import { XCircleIcon, CheckCircleIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/solid';

const ListItem = ({ children, type }: { children: React.ReactNode; type: 'problem' | 'solution' }) => {
  return (
    <li className="flex items-start gap-3">
      {type === 'problem' ? (
        <XCircleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
      )}
      <span className={cn("text-lg", type === 'problem' ? "text-slate-600" : "text-slate-700 font-medium")}>
        {children}
      </span>
    </li>
  );
};

export const ProblemSolutionSection = () => {
  return (
    <section className="py-20 bg-white">
      <MarketingContainer>
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Schluss mit Zettelwirtschaft und WhatsApp-Chaos.
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Kiko verwandelt deinen stressigen Organisations-Alltag in einen professionellen Auftritt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-stretch">
          {/* Problem Column */}
          <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100 relative overflow-hidden">
             
            <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              <span className="p-2 bg-red-100 rounded-lg text-red-600">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </span>
              Der Alltag ohne Kiko
            </h3>
            <ul className="space-y-6">
              <ListItem type="problem">Unzählige WhatsApp-Nachrichten und Anrufe zwischendurch.</ListItem>
              <ListItem type="problem">Veraltete Infos auf Flyern oder Listen.</ListItem>
              <ListItem type="problem">Unsicherheit über die Auslastung im nächsten Jahr.</ListItem>
              <ListItem type="problem">Das Gefühl, &quot;nur&quot; Babysitter zu sein.</ListItem>
            </ul>
          </div>

          {/* Solution Column */}
          <div className="bg-white rounded-3xl p-8 md:p-12 border-2 border-green-500/20 shadow-2xl shadow-green-900/5 relative overflow-hidden transform md:-rotate-1 hover:rotate-0 transition-transform duration-300">
             <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-16 -mt-16 z-0" />
            <h3 className="text-2xl font-bold text-green-700 mb-8 flex items-center gap-3 relative z-10">
              <span className="p-2 bg-green-100 rounded-lg text-green-600">
                <SparklesIcon className="w-6 h-6" />
              </span>
              Der Alltag mit Kiko
            </h3>
            <ul className="space-y-6 relative z-10">
              <ListItem type="solution">Eine professionelle Seite mit allen Infos (Konzept, Zeiten, Preise).</ListItem>
              <ListItem type="solution">Strukturierte Anfragen, die genau passen.</ListItem>
              <ListItem type="solution">Planbare Einnahmen durch klare Platzvergabe & digitale Produkte.</ListItem>
              <ListItem type="solution">Anerkennung als professionelle Bildungsperson.</ListItem>
            </ul>
             <div className="mt-8 pt-8 border-t border-slate-100 relative z-10">
                <p className="text-sm text-slate-500 italic">
                    &quot;Endlich habe ich den Kopf frei für das, was zählt.&quot;
                </p>
             </div>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
};
