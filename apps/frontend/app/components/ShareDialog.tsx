'use client';

import { CheckIcon, CopyIcon } from '@radix-ui/react-icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@trylinky/ui';
import { useState } from 'react';
import QRCode from 'react-qr-code';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('social');

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast({
        title: 'Link copied to clipboard',
        description: 'You can now paste it anywhere',
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const socialPlatforms = [
    {
      name: 'X',
      icon: 'https://cdn.lin.ky/default-data/icons/twitter-x.svg',
      shareUrl: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: 'Facebook',
      icon: 'https://cdn.lin.ky/default-data/icons/facebook.svg',
      shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: 'LinkedIn',
      icon: 'https://cdn.lin.ky/default-data/icons/linkedin.svg',
      shareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: 'Reddit',
      icon: 'https://cdn.lin.ky/default-data/icons/reddit.svg',
      shareUrl: `https://www.reddit.com/submit?url=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: 'WhatsApp',
      icon: 'https://cdn.lin.ky/default-data/icons/whatsapp.svg',
      shareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(currentUrl)}`,
    },
  ];

  const handleSocialShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Share this page
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center space-x-2 mb-4">
          <div className="grid flex-1 gap-2">
            <div className="flex items-center border rounded-md px-3 py-2 bg-muted">
              <span className="text-sm text-muted-foreground truncate flex-1">
                {currentUrl}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyToClipboard}
            className="shrink-0"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Tabs
          defaultValue="social"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="mt-4">
            <div className="grid grid-cols-5 gap-4">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handleSocialShare(platform.shareUrl)}
                  className="flex flex-col items-center justify-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={platform.icon}
                    alt={platform.name}
                    className="w-8 h-8"
                  />
                  <span className="text-xs text-center">{platform.name}</span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent
            value="qrcode"
            className="mt-4 flex flex-col items-center justify-center"
          >
            <div className="bg-white p-4 rounded-md">
              <QRCode value={currentUrl} size={200} />
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Scan this QR code to open this page on another device
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
