import React, { useEffect, useState } from 'react';
import { getTrackers, createTracker } from '../services/trackerService';

interface Tracker {
  id: string;
  tenant_id: string;
  name: string;
  business_question: string;
  description: string;
  type: string;
  scope: string;
  speaker_side: string;
  is_published: boolean;
}

const AISmartTrackerPage: React.FC = () => {
  const [trackers, setTrackers] = useState<Tracker[]>([]);

  useEffect(() => {
    const fetchTrackers = async () => {
      const data = await getTrackers();
      setTrackers(data);
    };

    fetchTrackers();
  }, []);

  const handleCreateTracker = async () => {
    const newTracker: Omit<Tracker, 'id'> = {
      tenant_id: 'example-tenant-id',
      name: 'New Tracker',
      business_question: 'What is the pricing strategy?',
      description: 'Detect pricing-related conversations.',
      type: 'pricing',
      scope: 'calls',
      speaker_side: 'customer',
      is_published: false,
    };

    const createdTracker = await createTracker(newTracker);
    setTrackers((prev) => [createdTracker, ...prev]);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-200">AI Smart Tracker</h1>
      <p className="text-slate-400 mt-2">Manage your trackers and detect important business signals from calls and emails.</p>

      <button onClick={handleCreateTracker} className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded">
        Create Tracker
      </button>

      <ul className="mt-6 space-y-4">
        {trackers.map((tracker) => (
          <li key={tracker.id} className="p-4 bg-slate-800 rounded shadow">
            <h2 className="text-lg font-semibold text-slate-200">{tracker.name}</h2>
            <p className="text-slate-400">{tracker.business_question}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AISmartTrackerPage;