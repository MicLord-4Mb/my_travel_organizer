import React, { useState, useMemo } from 'react';
import {
  Map,
  Footprints,
  Train,
  Plus,
  Minus,
  Navigation,
  Moon,
} from 'lucide-react';
import type { PlaceEvent, EventCategory, EntityId } from '@shared/types/models';
import {
  type TransitMode,
  type CarryOverStop,
  getCoordinatesDistanceKm,
  formatTimeWithPeriod,
  formatDurationLabel,
  getEventDurationMinutes,
  projectRouteMarkers,
} from '@entities/itinerary';
import { StopInspector } from './StopInspector';
import styles from './RouteMapInspector.module.css';

export interface RouteMapInspectorProps {
  dayNumber: number;
  events: PlaceEvent[];
  carryOver?: CarryOverStop | null;
  selectedEventId: EntityId | null;
  transitMode: TransitMode;
  onSelectEvent: (eventId: EntityId | null) => void;
  onTransitModeChange: (mode: TransitMode) => void;
  onEditEvent: (event: PlaceEvent) => void;
  onDeleteEvent: (event: PlaceEvent) => void;
  onReorderEvents?: (reordered: PlaceEvent[]) => void;
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  dining: 'var(--color-category-dining)',
  activities: 'var(--color-category-activities)',
  transport: 'var(--color-category-transport)',
  lodging: 'var(--color-category-lodging)',
};

export const RouteMapInspector: React.FC<RouteMapInspectorProps> = ({
  dayNumber,
  events,
  carryOver,
  selectedEventId,
  transitMode,
  onSelectEvent,
  onTransitModeChange,
  onEditEvent,
  onDeleteEvent,
  onReorderEvents,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  const carryOverOrigin = carryOver?.sourceEvent ?? null;

  // Compute geocoded stops and the total distance over legs (including carry-over origin -> first stop)
  const { geocodedCount, totalDistanceKm } = useMemo(() => {
    let dist = 0;
    let knownLegs = 0;

    if (carryOverOrigin && events.length > 0) {
      const firstLeg = getCoordinatesDistanceKm(
        carryOverOrigin.location?.lat,
        carryOverOrigin.location?.lng,
        events[0].location?.lat,
        events[0].location?.lng
      );
      if (firstLeg !== null) {
        dist += firstLeg;
        knownLegs += 1;
      }
    }

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
  }, [events, carryOverOrigin]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    if (carryOverOrigin && carryOverOrigin.id === selectedEventId) {
      return carryOverOrigin;
    }
    return events.find((e) => e.id === selectedEventId) ?? null;
  }, [events, carryOverOrigin, selectedEventId]);

  // Next stop for the live transit banner
  const nextStop = useMemo(() => {
    if (!events.length) return null;
    return events[1] || events[0];
  }, [events]);

  // Project markers from real geographic (lat, lng) coordinates
  const markerPositions = useMemo(
    () => projectRouteMarkers(events, carryOverOrigin),
    [events, carryOverOrigin]
  );

  // Build directed SVG route segments connecting markers in visit order
  const svgSegments = useMemo(() => {
    if (markerPositions.length < 2) return [];
    const segs: Array<{
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      isCarryOverLeg: boolean;
    }> = [];
    for (let i = 0; i < markerPositions.length - 1; i++) {
      const m1 = markerPositions[i];
      const m2 = markerPositions[i + 1];
      segs.push({
        key: `${m1.event.id}->${m2.event.id}-${i}`,
        x1: Number((m1.leftPercent * 3.6).toFixed(1)),
        y1: Number((m1.topPercent * 3.4).toFixed(1)),
        x2: Number((m2.leftPercent * 3.6).toFixed(1)),
        y2: Number((m2.topPercent * 3.4).toFixed(1)),
        isCarryOverLeg: Boolean(m1.isCarryOverOrigin),
      });
    }
    return segs;
  }, [markerPositions]);

  // Nearest-neighbor geographic route optimizer
  const handleOptimizeRoute = () => {
    if (!onReorderEvents || events.length < 3) return;
    const remaining = [...events];
    const ordered: PlaceEvent[] = [];

    // If there is a carry-over origin with coordinates, start from the stop closest to it;
    // otherwise keep the first stop anchored as the day's starting point.
    let currentAnchor: PlaceEvent;
    if (
      carryOverOrigin?.location?.lat != null &&
      carryOverOrigin?.location?.lng != null
    ) {
      currentAnchor = carryOverOrigin;
    } else {
      const first = remaining.shift()!;
      ordered.push(first);
      currentAnchor = first;
    }

    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const d = getCoordinatesDistanceKm(
          currentAnchor.location?.lat,
          currentAnchor.location?.lng,
          candidate.location?.lat,
          candidate.location?.lng
        );
        const score = d !== null ? d : 999999 + i;
        if (score < bestDist) {
          bestDist = score;
          bestIdx = i;
        }
      }

      const [chosen] = remaining.splice(bestIdx, 1);
      ordered.push(chosen);
      currentAnchor = chosen;
    }

    const updated = ordered.map((item, idx) => ({ ...item, order: idx }));
    onReorderEvents(updated);
  };

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

          {/* Directed SVG Route Graph */}
          {svgSegments.length > 0 && (
            <svg
              className={styles.mapSvgPolyline}
              viewBox="0 0 360 340"
              preserveAspectRatio="none"
              data-testid="route-graph-svg"
            >
              <defs>
                <marker
                  id="route-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-primary)" />
                </marker>
              </defs>
              {svgSegments.map((seg) => (
                <line
                  key={seg.key}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={
                    seg.isCarryOverLeg
                      ? 'var(--color-category-lodging)'
                      : 'var(--color-primary)'
                  }
                  strokeWidth="3"
                  strokeDasharray={seg.isCarryOverLeg ? '4,4' : '6,4'}
                  strokeLinecap="round"
                  markerEnd="url(#route-arrow)"
                />
              ))}
            </svg>
          )}

          {/* Pins anchored at projected geographic coordinates */}
          {markerPositions.map(
            ({ event, index, topPercent, leftPercent, isCarryOverOrigin, hasCoordinates }) => {
              const isSelected = selectedEventId === event.id;
              const cat = (event.category || 'activities') as EventCategory;
              const pinColor = isCarryOverOrigin
                ? 'var(--color-category-lodging)'
                : CATEGORY_COLORS[cat] || 'var(--color-category-activities)';

              return (
                <div
                  key={isCarryOverOrigin ? `carry-${event.id}` : event.id}
                  data-testid={`map-marker-${isCarryOverOrigin ? 'carry' : event.id}`}
                  className={`${styles.mapMarker} ${
                    isSelected ? styles.mapMarkerSelected : ''
                  }`}
                  style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                  onClick={() => onSelectEvent(isSelected ? null : event.id)}
                  title={
                    isCarryOverOrigin
                      ? `Overnight start: ${event.title}`
                      : `${index}. ${event.title}${hasCoordinates ? '' : ' (no GPS)'}`
                  }
                >
                  <div
                    className={`${styles.markerPin} ${
                      isSelected ? styles.markerPinSelected : ''
                    } ${!hasCoordinates ? styles.markerPinApproximate : ''}`}
                    style={{ background: pinColor }}
                  >
                    {isCarryOverOrigin ? <Moon size={12} /> : index}
                  </div>
                  <span className={styles.markerLabel}>{event.title}</span>
                </div>
              );
            }
          )}

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
              {onReorderEvents && events.length >= 3 && (
                <button
                  type="button"
                  className={styles.optimizeBtn}
                  onClick={handleOptimizeRoute}
                  title="Reorder stops to minimize travel distance"
                >
                  Optimize Route
                </button>
              )}
            </div>

            <div className={styles.waypointsList}>
              {carryOver && (
                <div
                  className={styles.waypointItem}
                  onClick={() => onSelectEvent(carryOver.sourceEvent.id)}
                >
                  <div className={styles.waypointLeft}>
                    <span
                      className={styles.waypointNum}
                      style={{ background: 'var(--color-category-lodging)' }}
                    >
                      <Moon size={11} />
                    </span>
                    <span className={styles.waypointName}>
                      {carryOver.sourceEvent.title} (from Day {carryOver.sourceDayIndex + 1})
                    </span>
                  </div>
                  <span className={styles.waypointTime}>
                    Ends {formatTimeWithPeriod(carryOver.endTime).time}{' '}
                    {formatTimeWithPeriod(carryOver.endTime).period}
                  </span>
                </div>
              )}

              {events.map((event, i) => {
                const cat = (event.category || 'activities') as EventCategory;
                const color = CATEGORY_COLORS[cat] || 'var(--color-category-activities)';
                const time = formatTimeWithPeriod(event.startTime);
                const durationLabel = formatDurationLabel(getEventDurationMinutes(event));

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
                    <span className={styles.waypointTime}>
                      {event.startTime ? `${time.time} ${time.period} • ` : ''}
                      {durationLabel}
                    </span>
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
