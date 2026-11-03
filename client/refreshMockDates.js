import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d, days) {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

// Relative day offsets from today for trip start dates:
const relativeOffsets = {
  'trip-completed-full': -120, // Ended ~4 months ago
  'trip-completed-gaps': -45,  // Ended ~1.5 months ago
  'trip-partial-tokyo': -2,    // In Progress: started 2 days ago, ends in 3 days
  'trip-partial-rome': 14,     // Planned: starts in 2 weeks
  'trip-future-alps': 75,      // Planned: winter ski
  'trip-future-amalfi': 210    // Planned: summer escape
};

const tripDeltas = new Map();

for (const trip of db.trips) {
  const oldStart = parseDate(trip.startDate);
  const oldEnd = parseDate(trip.endDate);
  const duration = Math.round((oldEnd.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24));

  const offset = relativeOffsets[trip.id] ?? 30;
  const newStart = addDays(today, offset);
  const newEnd = addDays(newStart, duration);

  const deltaDays = Math.round((newStart.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24));
  tripDeltas.set(trip.id, deltaDays);

  trip.startDate = formatDate(newStart);
  trip.endDate = formatDate(newEnd);

  // Sync status with actual calendar dates
  if (newEnd < today) {
    trip.status = 'completed';
  } else if (newStart <= today && today <= newEnd) {
    trip.status = 'in_progress';
  } else {
    trip.status = 'planned';
  }
}

// Adjust expenses dates by corresponding trip delta
if (Array.isArray(db.expenses)) {
  for (const expense of db.expenses) {
    const delta = tripDeltas.get(expense.tripId);
    if (delta !== undefined && expense.date) {
      const oldExpDate = parseDate(expense.date);
      const newExpDate = addDays(oldExpDate, delta);
      expense.date = formatDate(newExpDate);
    }
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n', 'utf8');

console.log(`Successfully refreshed mock dates in ${dbPath} relative to ${formatDate(today)}:`);
for (const trip of db.trips) {
  console.log(`  - [${trip.status.toUpperCase()}] ${trip.title}: ${trip.startDate} -> ${trip.endDate}`);
}

