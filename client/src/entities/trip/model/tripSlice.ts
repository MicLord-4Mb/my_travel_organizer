import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Trip, EntityId } from '@shared/types/models';
import { LocalStorageTripRepository } from '@shared/api/storage/LocalStorageTripRepository';
import type { RootState } from '@app/store';

const tripRepository = new LocalStorageTripRepository();

export const tripAdapter = createEntityAdapter<Trip>({
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
});

export const fetchTrips = createAsyncThunk('trip/fetchTrips', async () => {
  return await tripRepository.getAllTrips();
});

export const fetchTripById = createAsyncThunk('trip/fetchTripById', async (id: EntityId) => {
  return await tripRepository.getTripById(id);
});

export const createTrip = createAsyncThunk(
  'trip/createTrip',
  async (payload: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await tripRepository.createTrip(payload);
  }
);

export const updateTrip = createAsyncThunk(
  'trip/updateTrip',
  async ({ id, payload }: { id: EntityId; payload: Partial<Trip> }) => {
    return await tripRepository.updateTrip(id, payload);
  }
);

export const deleteTrip = createAsyncThunk('trip/deleteTrip', async (id: EntityId) => {
  await tripRepository.deleteTrip(id);
  return id;
});

export const duplicateTrip = createAsyncThunk('trip/duplicateTrip', async (id: EntityId) => {
  return await tripRepository.duplicateTrip(id);
});

interface TripState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  activeTripId: EntityId | null;
}

const initialState = tripAdapter.getInitialState<TripState>({
  status: 'idle',
  error: null,
  activeTripId: null,
});

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    setActiveTrip: (state, action: PayloadAction<EntityId | null>) => {
      state.activeTripId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.status = 'succeeded';
        tripAdapter.setAll(state, action.payload);
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch trips';
      })
      .addCase(fetchTripById.fulfilled, (state, action) => {
        if (action.payload) {
          tripAdapter.upsertOne(state, action.payload);
        }
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        tripAdapter.addOne(state, action.payload);
      })
      .addCase(updateTrip.fulfilled, (state, action) => {
        tripAdapter.upsertOne(state, action.payload);
      })
      .addCase(deleteTrip.fulfilled, (state, action) => {
        tripAdapter.removeOne(state, action.payload);
      })
      .addCase(duplicateTrip.fulfilled, (state, action) => {
        tripAdapter.addOne(state, action.payload);
      });
  },
});

export const { setActiveTrip } = tripSlice.actions;

const tripSelectors = tripAdapter.getSelectors<RootState>((state) => state.trip);

export const {
  selectAll: selectAllTrips,
  selectById: selectTripById,
  selectIds: selectTripIds,
  selectEntities: selectTripEntities,
} = tripSelectors;

export const selectTripStatus = (state: RootState) => state.trip.status;
export const selectActiveTripId = (state: RootState) => state.trip.activeTripId;

export default tripSlice.reducer;
