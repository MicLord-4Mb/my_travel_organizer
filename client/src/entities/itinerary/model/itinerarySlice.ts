import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * State representing ephemeral UI settings for the Itinerary Workspace.
 */
export interface ItineraryUIState {
  /** Currently active timeline day index (1-based for user display, defaults to 1) */
  activeDayIndex: number;
  /** Active category filter ('all' or specific event category) */
  categoryFilter: string;
  /** Chosen transit calculation mode ('walk', 'drive', 'transit') */
  transitMode: string;
  /** ID of the currently focused or inspected itinerary event, if any */
  selectedEventId: string | null;
}

const initialState: ItineraryUIState = {
  activeDayIndex: 1,
  categoryFilter: 'all',
  transitMode: 'walk',
  selectedEventId: null,
};

/**
 * Redux slice managing itinerary timeline and navigation workspace state.
 */
export const itinerarySlice = createSlice({
  name: 'itinerary',
  initialState,
  reducers: {
    /**
     * Updates the active day index and clears selected event inspection.
     *
     * @param state - Draft slice state.
     * @param action - Action containing target day index.
     */
    setActiveDayIndex: (state, action: PayloadAction<number>) => {
      state.activeDayIndex = action.payload;
      state.selectedEventId = null;
    },
    /**
     * Updates the category filter for timeline events.
     *
     * @param state - Draft slice state.
     * @param action - Action containing category filter string.
     */
    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.categoryFilter = action.payload;
    },
    /**
     * Updates the selected event ID for map/inspector drilldown.
     *
     * @param state - Draft slice state.
     * @param action - Action containing event ID or null.
     */
    setSelectedEventId: (state, action: PayloadAction<string | null>) => {
      state.selectedEventId = action.payload;
    },
    /**
     * Updates the navigation transit routing mode.
     *
     * @param state - Draft slice state.
     * @param action - Action containing transit mode ('walk' | 'drive' | 'transit').
     */
    setTransitMode: (state, action: PayloadAction<string>) => {
      state.transitMode = action.payload;
    },
  },
});

export const {
  setActiveDayIndex,
  setCategoryFilter,
  setSelectedEventId,
  setTransitMode,
} = itinerarySlice.actions;

export default itinerarySlice.reducer;
