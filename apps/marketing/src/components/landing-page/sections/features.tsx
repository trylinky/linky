import analyticsImg from '@/assets/landing-page/analytics.png';
import dropDragImg from '@/assets/landing-page/realtime-blocks.png';
import { MarketingContainer } from '@/components/marketing-container';
import {
  CalendarIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PaintBrushIcon,
  PhotoIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@trylinky/ui';
import Image, { StaticImageData } from 'next/image';

interface FeatureItemProps {
  imageSrc: StaticImageData;
  title: string;
  description: string;
  imageBgClass?: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({
  imageSrc,
  title,
  description,
  imageBgClass,
}) => {
  return (
    <div className={cn('flex flex-col text-left group')}>
      <div
        className={cn(
          'bg-[#F5F5F5] rounded-xl mb-6 w-full h-64 flex items-center justify-center relative overflow-hidden group-hover:shadow-lg transition-all duration-300',
          imageBgClass
        )}
      >
        <Image
          src={imageSrc}
          alt=""
          width={852}
          height={590}
          className="object-center max-h-full w-auto group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-base leading-relaxed">{description}</p>
    </div>
  );
};

const icons = {
  globe: GlobeAltIcon,
  lock: LockClosedIcon,
  document: DocumentTextIcon,
  paint: PaintBrushIcon,
  check: CheckBadgeIcon,
  user: UserGroupIcon,
  calendar: CalendarIcon,
  photo: PhotoIcon,
};

const SmallFeatureItem: React.FC<{
  title: string;
  description: string;
  icon: keyof typeof icons;
  iconClassName?: string;
}> = ({ icon, title, description, iconClassName }) => {
  const Icon = icons[icon];
  return (
    <div className={cn('flex flex-col text-left p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-slate-100')}>
      <div className={cn("rounded-full p-3 w-fit mb-4 bg-white shadow-sm", iconClassName?.replace('text-', 'bg-').replace('500', '100'))}>
          <Icon className={cn('size-6', iconClassName)} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-base leading-relaxed">{description}</p>
    </div>
  );
};

export const FeaturesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        {/* Background elements for visual interest */}
        <div className="absolute top-0 left-0 w-full h-full bg-slate-50/50 -skew-y-3 z-0 transform origin-top-left scale-110" />
      
      <MarketingContainer className="relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Was dir Kiko konkret bringt
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
             Weniger Stress, mehr Zeit für die Kinder und ein professioneller Auftritt.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <FeatureItem
            imageSrc={analyticsImg}
            title="Mehr passende Anfragen & stabilere Auslastung"
            description="Eltern finden dich gezielt nach Ort und Alter. Deine Seite zeigt automatisch freie Plätze. Das bedeutet: Weniger Leerlauf und ein sicheres Einkommen für dich."
          />
          <FeatureItem
            imageSrc={dropDragImg}
            title="Zusätzliche Einnahmequellen"
            description="Verdiene mehr als nur die Pauschale. Verkaufe deine eigenen Elternguides (PDFs), Eingewöhnungs-Tipps oder Beratungsstunden direkt über dein Profil."
          />
           <FeatureItem
            imageSrc={dropDragImg} // Reusing image but ideally should be different
            title="Weniger Chaos & Mental Load"
            description="Schluss mit 'Habe ich das schon geschickt?'. Öffnungszeiten, Urlaub, Konzept und Dokumente sind zentral an einem Ort. Du hast den Kopf frei für die Kinder."
          />
           <FeatureItem
            imageSrc={analyticsImg} // Reusing image
             title="Sichtbarkeit & Anerkennung"
            description="Zeige stolz, wer du bist. Dein professionelles Profil unterstreicht deine pädagogische Arbeit und schafft sofort Vertrauen bei neuen Eltern."
          />
        </div>
      </MarketingContainer>
    </section>
  );
};

export const ExpandedFeaturesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <MarketingContainer>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Alles, was du für deinen professionellen Auftritt brauchst.
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
             Kiko gibt dir die Werkzeuge an die Hand, um dich und deine Arbeit perfekt zu präsentieren.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SmallFeatureItem
            icon="paint"
            iconClassName="text-purple-600"
            title="Vorgefertigte Blöcke"
            description="Erstelle deine Seite im Handumdrehen mit unseren 'Ready Blocks'. Einfach auswählen, Text anpassen, fertig."
          />
          <SmallFeatureItem
            icon="photo"
            iconClassName="text-pink-600"
            title="Galerie & Einblicke"
            description="Zeige Eltern deine Räumlichkeiten und Aktivitäten. Lade Bilder direkt vom Handy hoch."
          />
          <SmallFeatureItem
            icon="document"
            iconClassName="text-indigo-600"
            title="Digitale Dokumente"
            description="Biete Eltern wichtige Infos wie Wochenpläne, Speisepläne oder Konzepte direkt zum Download an."
          />
          <SmallFeatureItem
            icon="calendar"
            iconClassName="text-blue-600"
            title="Smarte Terminbuchung"
            description="Lass Eltern Kennenlern-Termine oder Beratungsgespräche direkt über deinen Kalender buchen."
          />
        </div>
      </MarketingContainer>
    </section>
  );
};
