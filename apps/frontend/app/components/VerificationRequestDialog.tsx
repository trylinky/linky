'use client';

import { FormField } from '@/app/components/FormField';
import { createVerificationRequest } from '@/app/lib/actions/verification';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@trylinky/ui';
import { Form, Formik } from 'formik';
import { withZodSchema } from 'formik-validator-zod';
import { z } from 'zod';

export default function VerificationRequestDialog({
  open,
  onOpenChange,
  pageId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Apply for page verification{' '}
            <svg viewBox="0 0 22 22" width={24} height={24}>
              <g>
                <path
                  fill="#32a2ed"
                  d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                ></path>
              </g>
            </svg>
          </DialogTitle>
          <DialogDescription>
            Once verified, you will be able to choose to display a badge in the
            Header block. However, you will not be able to change the title
            without contacting support.
            <br />
            <br />
            Please choose a title that you would like to be displayed next to
            the verified badge. Normally this is your name or brand name.
            <br />
            <br />
            We will reach out to you for approval.
          </DialogDescription>
        </DialogHeader>

        <VerificationRequestForm onCancel={onOpenChange} pageId={pageId} />
      </DialogContent>
    </Dialog>
  );
}

export const verificationRequestSchema = z.object({
  requestedPageTitle: z.string({
    required_error: 'Please provide a page slug',
  }),
});

function VerificationRequestForm({
  onCancel,
  pageId,
}: {
  onCancel: (open: boolean) => void;
  pageId: string;
}) {
  const onSubmit = async (
    values: z.infer<typeof verificationRequestSchema>
  ) => {
    const req = await createVerificationRequest({
      pageId,
      requestedPageTitle: values.requestedPageTitle,
    });

    if (req.error) {
      toast({
        title: 'Sorry, there was a problem submitting your request',
        description: req.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Verification request submitted',
      });
      onCancel(false);
    }
  };

  return (
    <Formik
      initialValues={{
        requestedPageTitle: '',
      }}
      validate={withZodSchema(verificationRequestSchema)}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ isSubmitting, values, setFieldValue, errors }) => (
        <Form className="w-full flex flex-col">
          <div className="mt-4">
            <FormField
              label="Page title"
              name="requestedPageTitle"
              placeholder="My page title"
              id="requestedPageTitle"
              error={errors.requestedPageTitle}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onCancel(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Submit request
            </Button>
          </DialogFooter>
        </Form>
      )}
    </Formik>
  );
}
