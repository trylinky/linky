import { MarketingContainer } from '@/components/marketing-container';
import { UserPlusIcon, RectangleStackIcon, ShareIcon } from '@heroicons/react/24/outline'; // Best guess icons

const Step = ({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) => {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center text-center relative z-10">
      <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-6 border border-slate-100 relative group">
         <div className="absolute inset-0 bg-indigo-50 rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
        <Icon className="w-8 h-8 text-indigo-600 relative z-10" />
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-slate-50">
            {number}
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 text-base leading-relaxed max-w-sm">
        {description}
      </p>
    </div>
  );
};

export const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-slate-50 relative">
      <MarketingContainer>
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            In 3 Schritten zu deiner Seite
          </h2>
          <p className="text-xl text-slate-600">
             Dein Weg zur professionellen Kiko-Präsenz
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Connecting Line (Hidden on mobile) */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-0" />

          <Step
            number="1"
            title="Profil erstellen"
            description="Registriere dich und fülle dein Profil aus. Erzähle von deinem Konzept und lade Bilder hoch. (Dauer: ca. 15 Min)"
            icon={UserPlusIcon}
          />
          <Step
            number="2"
            title="Angebote hinzufügen"
            description="Trage deine freien Plätze ein und lade optional digitale Produkte (z.B. Wochenpläne) hoch."
            icon={RectangleStackIcon}
          />
          <Step
            number="3"
            title="Teilen & Gefunden werden"
            description="Teile deinen Link auf Instagram/WhatsApp. Gleichzeitig bist du im Kiko-Marktplatz für Eltern in deiner Stadt sichtbar."
            icon={ShareIcon}
          />
        </div>
      </MarketingContainer>
    </section>
  );
};
