import { EditFormProps } from '../types';
import { FormField } from '@/components/FormField';
import { FormFileUpload } from '@/components/FormFileUpload';
import { IconSelect } from '@/components/IconSelect';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { LinkBarBlockConfig, LinkBarSchema } from '@trylinky/blocks';
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
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
}: EditFormProps<LinkBarBlockConfig>) {
  const onSubmit = async (
    values: LinkBarBlockConfig,
    { setSubmitting }: FormikHelpers<LinkBarBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  return (
    <Formik
      initialValues={{
        links: initialValues?.links ?? [],
      }}
      validationSchema={LinkBarSchema}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ isSubmitting, setFieldValue, errors, values }) => {
        return (
          <Form className="w-full flex flex-col gap-1">
            <FieldArray name="links">
              {({ push, remove }) => (
                <>
                  <div className="flex flex-col space-y-2">
                    {values?.links?.map((item, index) => {
                      const linkErrors = getIn(errors, `links[${index}]`);

                      const initialUploadedIcon = !values.links[
                        index
                      ].icon.src.startsWith('https://cdn.lin.ky/default-data')
                        ? values.links[index].icon.src
                        : undefined;

                      const initialTab = values.links[
                        index
                      ].icon.src?.startsWith('https://cdn.lin.ky/default-data')
                        ? 'iconGallery'
                        : 'uploadCustom';

                      return (
                        <Collapsible
                          key={index}
                          defaultOpen={index === 0}
                          className="flex flex-col space-y-1 bg-stone-50 border-stone-200 border rounded-lg px-3 py-3"
                        >
                          <CollapsibleTrigger className="flex justify-between items-center">
                            <span className="font-medium text-sm">
                              List item {index + 1}
                            </span>
                            <CaretSortIcon className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-4">
                            <FormField
                              label="URL"
                              name={`links.${index}.link`}
                              id={`links.${index}.link`}
                              error={linkErrors?.link}
                              placeholder="https://twitter.com/trylinky"
                            />

                            <div>
                              <Label htmlFor={`links.${index}.image`}>
                                Icon
                              </Label>

                              <Tabs
                                defaultValue={initialTab}
                                className="w-full"
                              >
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
                                    initialValue={values.links[index].icon.src}
                                    onIconChange={(val) =>
                                      setFieldValue(
                                        `links.${index}.icon.src`,
                                        val
                                      )
                                    }
                                  />
                                </TabsContent>
                                <TabsContent value="uploadCustom">
                                  <FormFileUpload
                                    htmlFor={`links.${index}.icon.src`}
                                    onUploaded={(val) =>
                                      setFieldValue(
                                        `links.${index}.icon.src`,
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

                              {linkErrors?.icon?.src && (
                                <p
                                  className="mt-2 text-sm text-red-600"
                                  id={`icon-src-error`}
                                >
                                  {linkErrors?.icon.src}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="destructive"
                              type="button"
                              className="w-full mt-4"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              Remove item
                            </Button>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                    <Button
                      variant="outline"
                      onClick={() => push({ link: '', icon: { src: '' } })}
                    >
                      Add Link
                    </Button>
                    {typeof errors.links === 'string' && (
                      <p
                        className="mt-2 text-sm text-red-600"
                        id={`icon-src-error`}
                      >
                        {errors.links as string}
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
