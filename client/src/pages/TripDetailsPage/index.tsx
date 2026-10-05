import { useParams, Link } from 'react-router-dom';

export default function TripDetailsPage() {
  const { id } = useParams();

  return (
    <div>
      <Link to="/">Back to Trips</Link>
      <h1>Trip Details: {id}</h1>
      <nav>
        <ul>
          <li>Program (Itinerary)</li>
          <li>Budget (Expenses)</li>
          <li>Checklist</li>
        </ul>
      </nav>
      <div>Content goes here</div>
    </div>
  );
}
