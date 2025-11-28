import {
  ComponentType,
  FC,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

interface BasicProps {
  width?: number;
  children?: ReactNode;
}

export function WidthProvideRGL<Config extends BasicProps>(
  ComposedComponent: ComponentType<Config>,
  isPotentiallyMobile: boolean
): FC<Config> {
  return function WidthProvider(props: Config) {
    const [width, setWidth] = useState<number>(
      isPotentiallyMobile ? 400 : 1280
    );

    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const newElement = elementRef.current;
      const resizeObserver = new ResizeObserver((entries) => {
        if (newElement) {
          const newWidth = entries[0].contentRect.width;
          setWidth(newWidth);
        }
      });

      if (newElement) {
        resizeObserver.observe(newElement);
      }

      return () => {
        if (newElement) {
          resizeObserver.unobserve(newElement);
        }
        resizeObserver.disconnect();
      };
    }, []);

    // Use a custom prop for the ref to avoid conflicts with existing `ref` props
    const composedComponentProps = {
      ...props,
      width,
      innerRef: elementRef,
    };

    return <ComposedComponent {...composedComponentProps} />;
  };
}
