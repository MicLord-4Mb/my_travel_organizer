import React, { useState, useMemo } from 'react';
import {
  Map,
  Footprints,
  Train,
  Plus,
  Minus,
  Navigation,
} from 'lucide-react';
import type { PlaceEvent, EventCategory, EntityId } from '@shared/types/models';
import type { TransitMode } from '@entities/itinerary';
import { StopInspector } from './StopInspector';
import {
  getCoordinatesDistanceKm,
  formatTimeWithPeriod,
} from '../lib/itineraryUtils';
import { useToast } from '@shared/ui';
import styles from './RouteMapInspector.module.css';

export interface RouteMapInspectorProps {
  dayNumber: number;
  events: PlaceEvent[];
  selectedEventId: EntityId | null;
  transitMode: TransitMode;
  onSelectEvent: (eventId: EntityId | null) => void;
  onTransitModeChange: (mode: TransitMode) => void;
  onEditEvent: (event: PlaceEvent) => void;
  onDeleteEvent: (event: PlaceEvent) => void;
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  dining: '#F59E0B',
  activities: '#10B981',
  transport: '#3B82F6',
  lodging: '#8B5CF6',
};

// Preset positions for realistic aesthetic presentation in the map container (percentages)
const DEFAULT_PRESET_POSITIONS = [
  { top: 22, left: 28 },
  { top: 40, left: 45 },
  { top: 58, left: 52 },
  { top: 72, left: 68 },
  { top: 82, left: 42 },
  { top: 32, left: 74 },
  { top: 50, left: 24 },
];

export const RouteMapInspector: React.FC<RouteMapInspectorProps> = ({
  dayNumber,
  events,
  selectedEventId,
  transitMode,
  onSelectEvent,
  onTransitModeChange,
  onEditEvent,
  onDeleteEvent,
}) => {
  const { toast } = useToast();
  const [zoomLevel, setZoomLevel] = useState(1);

  // Compute geocoded stops and the total distance over legs where both stops have coordinates
  const { geocodedCount, totalDistanceKm } = useMemo(() => {
    let dist = 0;
    let knownLegs = 0;
    for (let i = 0; i < events.length - 1; i++) {
      const e1 = events[i];
      const e2 = events[i + 1];
      const leg = getCoordinatesDistanceKm(
        e1.location?.lat,
        e1.location?.lng,
        e2.location?.lat,
        e2.location?.lng
      );
      if (leg !== null) {
        dist += leg;
        knownLegs += 1;
      }
    }
    return {
      geocodedCount: events.filter(
        (e) => e.location?.lat != null && e.location?.lng != null
      ).length,
      totalDistanceKm: knownLegs > 0 ? Math.round(dist * 10) / 10 : null,
    };
  }, [events]);

  const selectedEvent = useMemo(
    () => (selectedEventId ? events.find((e) => e.id === selectedEventId) : null),
    [events, selectedEventId]
  );

  // Next stop for the live transit banner
  const nextStop = useMemo(() => {
    if (!events.length) return null;
    return events[1] || events[0];
  }, [events]);

  // Generate marker coordinates
  const markerPositions = useMemo(() => {
    return events.map((event, index) => {
      // Use preset visual coordinates for consistent, non-overlapping canvas pins
      const preset =
        DEFAULT_PRESET_POSITIONS[index % DEFAULT_PRESET_POSITIONS.length];
      return {
        event,
        index: index + 1,
        topPercent: preset.top,
        leftPercent: preset.left,
      };
    });
  }, [events]);

  // Build SVG polyline points string
  const svgPathD = useMemo(() => {
    if (markerPositions.length < 2) return '';
    const points = markerPositions.map(
      (m) => `${(m.leftPercent * 3.6).toFixed(0)},${(m.topPercent * 3.4).toFixed(0)}`
    );
    return `M ${points.join(' L ')}`;
  }, [markerPositions]);

  return (
    <aside aria-label="Route Map and Stop Inspector" className={styles.inspectorAside}>
      <div className={styles.mapCard}>
        {/* Header */}
        <div className={styles.mapHeader}>
          <div className={styles.mapTitleGroup}>
            <span className={styles.mapTitle}>
              <Map size={18} color="var(--color-primary)" />
              Day {dayNumber} Route Map
            </span>
            <span className={styles.mapSubtitle}>
              {geocodedCount} geocoded stops •{' '}
              {totalDistanceKm !== null ? `${totalDistanceKm} km total distance` : 'distance unknown'}
            </span>
            <span style={{ fontSize: '10px', color: '#f59e0b', marginTop: '2px', display: 'block' }}>
              Interactive map coming in Stage 2 (Static Preview)
            </span>
          </div>

          {/* Mode Switcher */}
          <div className={styles.modeSwitch}>
            <button
              type="button"
              className={`${styles.modeBtn} ${
                transitMode === 'walk' ? styles.modeBtnActive : ''
              }`}
              onClick={() => onTransitModeChange('walk')}
              title="Walking route mode"
              aria-label="Walk mode"
            >
              <Footprints size={15} />
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${
                transitMode === 'transit' ? styles.modeBtnActive : ''
              }`}
              onClick={() => onTransitModeChange('transit')}
              title="Transit / rail route mode"
              aria-label="Transit mode"
            >
              <Train size={15} />
            </button>
          </div>
        </div>

        {/* Map View Area */}
        <div className={styles.mapView}>
          {/* Topographic clean background with stylized map texture */}
          <div
            className={styles.mapCanvasBg}
            style={{
              transform: `scale(${zoomLevel})`,
              backgroundImage:
                'url(https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80)',
              filter: 'brightness(1.02) contrast(0.96) saturate(0.85)',
            }}
          />

          {/* SVG Polyline */}
          {svgPathD && (
            <svg
              className={styles.mapSvgPolyline}
              viewBox="0 0 360 340"
              preserveAspectRatio="none"
            >
              <path
                d={svgPathD}
                fill="none"
                stroke="#0D9488"
                strokeWidth="3.5"
                strokeDasharray="6,4"
                strokeLinecap="round"
              />
            </svg>
          )}

          {/* Pins */}
          {markerPositions.map(({ event, index, topPercent, leftPercent }) => {
            const isSelected = selectedEventId === event.id;
            const cat = (event.category || 'activities') as EventCategory;
            const pinColor = CATEGORY_COLORS[cat] || '#10B981';

            return (
              <div
                key={event.id}
                className={`${styles.mapMarker} ${
                  isSelected ? styles.mapMarkerSelected : ''
                }`}
                style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                onClick={() => onSelectEvent(isSelected ? null : event.id)}
                title={`${index}. ${event.title}`}
              >
                <div
                  className={`${styles.markerPin} ${
                    isSelected ? styles.markerPinSelected : ''
                  }`}
                  style={{ background: pinColor }}
                >
                  {index}
                </div>
                <span className={styles.markerLabel}>{event.title}</span>
              </div>
            );
          })}

          {/* Zoom controls */}
          <div className={styles.zoomControls}>
            <button
              type="button"
              className={styles.zoomBtn}
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              aria-label="Zoom in"
            >
              <Plus size={16} />
            </button>
            <div className={styles.zoomDivider} />
            <button
              type="button"
              className={styles.zoomBtn}
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
              aria-label="Zoom out"
            >
              <Minus size={16} />
            </button>
          </div>

          {/* Live Transit Banner */}
          {nextStop && (
            <div className={styles.transitInsightBanner}>
              <Navigation size={14} className={styles.bannerIcon} />
              <span>Next: {nextStop.title}</span>
            </div>
          )}
        </div>

        {/* Selected Stop Inspector or Waypoint Sequence Sheet */}
        {selectedEvent ? (
          <StopInspector
            event={selectedEvent}
            onClose={() => onSelectEvent(null)}
            onEdit={() => onEditEvent(selectedEvent)}
            onDelete={() => onDeleteEvent(selectedEvent)}
          />
        ) : (
          <div className={styles.sequenceSheet}>
            <div className={styles.sequenceHeader}>
              <span className={styles.sequenceTitle}>Waypoint Sequence</span>
              <button
                type="button"
                className={styles.optimizeBtn}
                onClick={() => toast({ title: 'Not Implemented', description: 'Route Optimization (TSP solver) is coming in Stage 2!' })}
                title="Route waypoints are chronologically organized"
              >
                Optimize Route
              </button>
            </div>

            <div className={styles.waypointsList}>
              {events.map((event, i) => {
                const cat = (event.category || 'activities') as EventCategory;
                const color = CATEGORY_COLORS[cat] || '#10B981';
                const time = formatTimeWithPeriod(event.startTime);

                return (
                  <div
                    key={event.id}
                    className={styles.waypointItem}
                    onClick={() => onSelectEvent(event.id)}
                  >
                    <div className={styles.waypointLeft}>
                      <span
                        className={styles.waypointNum}
                        style={{ background: color }}
                      >
                        {i + 1}
                      </span>
                      <span className={styles.waypointName}>{event.title}</span>
                    </div>
                    {event.startTime && (
                      <span className={styles.waypointTime}>
                        {time.time} {time.period}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
