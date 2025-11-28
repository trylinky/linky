import { EditFormProps } from '../types';
import { FormField } from '@/components/FormField';
import { FormFileUpload } from '@/components/FormFileUpload';
import { IconSelect } from '@/components/IconSelect';
import { StackBlockConfig, StackSchema } from '@trylinky/blocks';
import {
  Button,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@trylinky/ui';
import { FieldArray, Form, Formik, FormikHelpers, getIn } from 'formik';
import { Loader2 } from 'lucide-react';

export function EditForm({
  initialValues,
  onSave,
  onClose,
  blockId,
}: EditFormProps<StackBlockConfig>) {
  const onSubmit = async (
    values: StackBlockConfig,
    { setSubmitting }: FormikHelpers<StackBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  return (
    <Formik
      initialValues={{
        title: initialValues?.title ?? '',
        label: initialValues?.label ?? '',
        items: initialValues?.items ?? [],
      }}
      validationSchema={StackSchema}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ values, setFieldValue, isSubmitting, errors }) => {
        return (
          <Form className="w-full flex flex-col gap-2">
            <FormField
              label="Title"
              name="title"
              id="title"
              error={errors.title}
            />
            <FormField
              label="Label"
              name="label"
              id="label"
              error={errors.label}
            />

            <FieldArray name="items">
              {({ push, remove }) => (
                <>
                  <div className="flex flex-col space-y-2">
                    {values?.items?.map((item, index) => {
                      const itemErrors = getIn(errors, `items[${index}]`);

                      const initialUploadedIcon = !values.items[
                        index
                      ].icon.src.startsWith('https://cdn.lin.ky/default-data')
                        ? values.items[index].icon.src
                        : undefined;

                      const initialTab = values.items[
                        index
                      ].icon.src?.startsWith('https://cdn.lin.ky/default-data')
                        ? 'iconGallery'
                        : 'uploadCustom';

                      return (
                        <div
                          key={index}
                          className="flex flex-col space-y-1 bg-stone-50 border-stone-200 border rounded-lg px-3 py-3"
                        >
                          <span className="font-medium text-sm mb-3">
                            List item {index + 1}
                          </span>
                          <FormField
                            label="Title"
                            name={`items.${index}.title`}
                            id={`items.${index}.title`}
                            error={itemErrors?.title}
                          />
                          <FormField
                            label="Label"
                            name={`items.${index}.label`}
                            id={`items.${index}.label`}
                            error={itemErrors?.label}
                          />
                          <FormField
                            label="Link"
                            name={`items.${index}.link`}
                            id={`items.${index}.link`}
                            error={itemErrors?.link}
                          />
                          <div>
                            <Label htmlFor={`items.${index}.image`}>Icon</Label>

                            <Tabs defaultValue={initialTab} className="w-full">
                              <TabsList className="w-full">
                                <TabsTrigger
                                  className="w-1/2"
                                  value="iconGallery"
                                >
                                  Icon Gallery
                                </TabsTrigger>
                                <TabsTrigger
                                  className="w-1/2"
                                  value="uploadCustom"
                                >
                                  Upload
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent value="iconGallery">
                                <IconSelect
                                  initialValue={values.items[index].icon.src}
                                  onIconChange={(val) =>
                                    setFieldValue(
                                      `items.${index}.icon.src`,
                                      val
                                    )
                                  }
                                />
                              </TabsContent>
                              <TabsContent value="uploadCustom">
                                <FormFileUpload
                                  htmlFor={`items.${index}.icon`}
                                  onUploaded={(val) =>
                                    setFieldValue(
                                      `items.${index}.icon.src`,
                                      val
                                    )
                                  }
                                  initialValue={initialUploadedIcon}
                                  referenceId={blockId}
                                  isCondensed
                                  assetContext="blockAsset"
                                />
                              </TabsContent>
                            </Tabs>

                            {itemErrors?.icon?.src && (
                              <p
                                className="mt-2 text-sm text-red-600"
                                id={`icon-src-error`}
                              >
                                {itemErrors?.icon.src}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() => remove(index)}
                          >
                            Remove item
                          </Button>
                        </div>
                      );
                    })}
                    <Button
                      variant="outline"
                      onClick={() =>
                        push({ title: '', label: '', icon: { src: '' } })
                      }
                    >
                      Add Item
                    </Button>
                    {typeof errors.items === 'string' && (
                      <p
                        className="mt-2 text-sm text-red-600"
                        id={`icon-src-error`}
                      >
                        {errors.items as string}
                      </p>
                    )}
                  </div>
                </>
              )}
            </FieldArray>
            <div className="flex flex-shrink-0 justify-between py-4 border-t border-stone-200">
              <Button type="button" variant="secondary" onClick={onClose}>
                ← Cancel
              </Button>
              <Button type="submit">
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
