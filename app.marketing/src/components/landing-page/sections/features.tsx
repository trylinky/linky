import analyticsImg from '@/assets/landing-page/analytics.png';
import dropDragImg from '@/assets/landing-page/realtime-blocks.png';
import { MarketingContainer } from '@/components/marketing-container';
import {
  CheckBadgeIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PaintBrushIcon,
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
    <div className={cn('flex flex-col text-left')}>
      <div
        className={cn(
          'bg-[#F5F5F5] rounded-xl mb-6 w-full h-64 flex items-center justify-center relative overflow-hidden',
          imageBgClass
        )}
      >
        <Image
          src={imageSrc}
          alt=""
          width={852}
          height={590}
          className="object-center max-h-full w-auto"
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
};

const SmallFeatureItem: React.FC<{
  title: string;
  description: string;
  icon: keyof typeof icons;
  iconClassName?: string;
}> = ({ icon, title, description, iconClassName }) => {
  const Icon = icons[icon];
  return (
    <div className={cn('flex flex-col text-left')}>
      <Icon className={cn('size-10 mb-2', iconClassName)} />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-base leading-relaxed">{description}</p>
    </div>
  );
};

export const FeaturesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <MarketingContainer>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl   font-bold tracking-tight text-gray-900">
            Tools to help you grow
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <FeatureItem
            imageSrc={analyticsImg}
            title="Analytics"
            description="See how your page is performing with our built-in analytics."
          />
          <FeatureItem
            imageSrc={dropDragImg}
            title="Live blocks"
            description="Show live data on your page with our real-time integrations."
          />
        </div>
      </MarketingContainer>
    </section>
  );
};

export const ExpandedFeaturesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <MarketingContainer>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl   font-bold tracking-tight text-gray-900">
            And much much more
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <SmallFeatureItem
            icon="globe"
            iconClassName="text-blue-500"
            title="Custom domains"
            description="Use your own domain name to make your page more professional."
          />
          <SmallFeatureItem
            icon="lock"
            iconClassName="text-green-500"
            title="Private pages"
            description="Build pages that are only accessible to you and your team."
          />
          <SmallFeatureItem
            icon="document"
            iconClassName="text-yellow-500"
            title="Forms"
            description="Collect emails, phone numbers, and more with our built-in form builder."
          />
          <SmallFeatureItem
            icon="paint"
            iconClassName="text-purple-500"
            title="Custom themes"
            description="Match your page to your brand with our custom theme builder."
          />
          <SmallFeatureItem
            icon="check"
            iconClassName="text-red-500"
            title="Verified pages"
            description="Get a badge to show that your page is verified."
          />
          <SmallFeatureItem
            icon="user"
            iconClassName="text-gray-500"
            title="Agency support"
            description="Manage multiple pages and users with our agency features."
          />
        </div>
      </MarketingContainer>
    </section>
  );
};
