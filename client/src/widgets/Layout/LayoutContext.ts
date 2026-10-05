import { useOutletContext } from 'react-router-dom';

export interface LayoutContextType {
  openNewTripModal: () => void;
  setOpenNewTripModalHandler: (handler: () => void) => void;
}

export const useLayoutContext = () => useOutletContext<LayoutContextType>();
