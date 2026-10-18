import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@shared/ui';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'var(--color-surface-container)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Compass size={28} />
      </div>
      <h1 style={{ fontSize: 'var(--font-size-title)', fontWeight: 600 }}>
        404 — Page Not Found
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: 380 }}>
        Looks like this route is off the map. Return to your trips dashboard to continue planning.
      </p>
      <Button variant="primary" onClick={() => navigate('/')}>
        Back to Trips
      </Button>
    </div>
  );
}

