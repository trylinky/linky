import { EditFormProps } from '../types';
import { FormField } from '@/components/FormField';
import { useLoadScript } from '@react-google-maps/api';
import { captureException } from '@sentry/nextjs';
import { MapBlockConfig, mapThemes } from '@trylinky/blocks';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Button,
} from '@trylinky/ui';
import { Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { Loader2 } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

declare global {
  namespace google.maps.places {
    interface QueryAutocompletePrediction {
      description: string;
    }
  }
}

export function EditForm({
  initialValues,
  onSave,
  onClose,
}: EditFormProps<MapBlockConfig>) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: ['places'],
  });

  const handleSubmit = async (
    values: MapBlockConfig,
    { setSubmitting }: FormikHelpers<MapBlockConfig>
  ) => {
    setSubmitting(true);
    onSave(values);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Formik
      initialValues={{
        coords: initialValues?.coords,
        mapTheme: initialValues?.mapTheme,
      }}
      onSubmit={handleSubmit}
      enableReinitialize={true}
    >
      {({ values, isSubmitting, errors }) => (
        <Form className="w-full flex flex-col gap-2">
          <GoogleMapsAutoCompleteInput />

          <div className="mt-4">
            <MapThemeSelect />
          </div>

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
      )}
    </Formik>
  );
}

const GoogleMapsAutoCompleteInput = () => {
  const { submitForm, setFieldValue } = useFormikContext();
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [predictions, setPredictions] = useState<
    google.maps.places.QueryAutocompletePrediction[]
  >([]);
  const geocoder = useRef<google.maps.Geocoder>(undefined);

  useEffect(() => {
    if (!window.google) {
      console.error('Google Maps API not loaded');
      return;
    }

    geocoder.current = new google.maps.Geocoder();

    const service = new google.maps.places.AutocompleteService();

    const displaySuggestions = (
      predictions: google.maps.places.QueryAutocompletePrediction[] | null,
      status: google.maps.places.PlacesServiceStatus
    ) => {
      if (
        status !== google.maps.places.PlacesServiceStatus.OK ||
        !predictions
      ) {
        alert(status);
        return;
      }
      setPredictions(predictions);
    };

    if (input) {
      service.getQueryPredictions({ input }, displaySuggestions);
    }
  }, [input]);

  const handleSelect = (address: string) => {
    if (!geocoder.current) return;

    geocoder.current.geocode(
      { address: address },
      async function (results, status) {
        if (status === 'OK' && results) {
          const firstResult = results[0].geometry;
          const coords = {
            lat: firstResult.location.lat(),
            long: firstResult.location.lng(),
          };

          try {
            await setFieldValue('coords', coords);
          } catch (error) {
            captureException(error);
          } finally {
            setTimeout(async () => {
              await submitForm();
            }, 100);
          }

          setOpen(false);
        } else {
          console.error(
            'Geocode was not successful for the following reason: ' + status
          );
        }
      }
    );
  };

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput
        className="border-0"
        onChangeCapture={(e: ChangeEvent<HTMLInputElement>) =>
          setInput(e.target.value)
        }
      />

      <CommandList>
        <CommandEmpty>Search for a place</CommandEmpty>
        <CommandGroup>
          {predictions.map((prediction) => (
            <CommandItem
              key={prediction.description}
              value={prediction.description}
              onSelect={(currentValue) => {
                handleSelect(prediction.description);
                setOpen(false);
              }}
            >
              {prediction.description}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

const MapThemeSelect = () => {
  const { values, setFieldValue } = useFormikContext<MapBlockConfig>();
  const [open, setOpen] = useState(false);

  return (
    <Command>
      <CommandInput placeholder="Search themes..." />
      <CommandList>
        <CommandEmpty>No themes found.</CommandEmpty>
        <CommandGroup>
          {Object.entries(mapThemes).map(([key, theme]) => (
            <CommandItem
              key={key}
              onSelect={(currentValue: string) => {
                setFieldValue('theme', currentValue);
                setOpen(false);
              }}
            >
              {theme.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
