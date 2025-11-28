'use client';

import { Blocks } from '@trylinky/blocks';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

type EditLayoutModes = 'desktop' | 'mobile';

type EditModeContextValue = {
  draggingItem: any;
  setDraggingItem: (newDraggingItem: any) => void;
  setNextToAddBlock: (newNextToAddBlock: any) => void;
  nextToAddBlock: any;
  editLayoutMode: EditLayoutModes;
  setEditLayoutMode: (newLayoutMode: any) => void;
  currentEditingBlock: { id: string; type: Blocks } | null;
  setCurrentEditingBlock: (
    newCurrentEditingBlock: {
      id: string;
      type: Blocks;
    } | null
  ) => void;
};

const EditModeContext = createContext<EditModeContextValue | undefined>(
  undefined
);

export const useEditModeContext = (): EditModeContextValue => {
  const context = useContext(EditModeContext);

  if (!context) {
    throw new Error(
      'useEditModeContext must be used within a EditModeContextProvider'
    );
  }

  return context;
};

export const EditModeContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [draggingItem, setDraggingItem] = useState();
  const [nextToAddBlock, setNextToAddBlock] = useState();
  const [editLayoutMode, setEditLayoutMode] =
    useState<EditLayoutModes>('desktop');
  const [currentEditingBlock, setCurrentEditingBlock] = useState<{
    id: string;
    type: Blocks;
  } | null>(null);

  const contextValue: EditModeContextValue = {
    draggingItem,
    setDraggingItem,
    editLayoutMode,
    setEditLayoutMode,
    nextToAddBlock,
    setNextToAddBlock,
    currentEditingBlock,
    setCurrentEditingBlock,
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 505) {
        setEditLayoutMode('desktop');
      } else {
        setEditLayoutMode('mobile');
      }
    };

    // Set initial layout mode
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <EditModeContext.Provider value={contextValue}>
      {children}
    </EditModeContext.Provider>
  );
};
