import { useSession } from '@/app/lib/auth';
import { PricingTable } from '@trylinky/common';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from '@trylinky/ui';
import { router } from 'better-auth/api';
import { useRouter } from 'next/navigation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageBillingDialog({ open, onOpenChange }: Props) {
  const { data } = useSession();
  const router = useRouter();

  const handleComplete = () => {
    onOpenChange(false);
    // Set the showPremiumOnboarding query param to true
    router.push(window.location.pathname + '?showPremiumOnboarding=true');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Your Plan</DialogTitle>
          <DialogDescription>
            Manage your teams billing information.
          </DialogDescription>
        </DialogHeader>

        <section className="bg-[#f5f3ea] px-6 py-12">
          <PricingTable
            isLoggedIn={!!data?.session}
            onComplete={handleComplete}
          />
        </section>
      </DialogContent>
    </Dialog>
  );
}
