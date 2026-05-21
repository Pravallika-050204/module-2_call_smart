// Fetch all trackers
export const getTrackers = async (): Promise<any[]> => {
  const response = await fetch('/api/trackers');
  if (!response.ok) throw new Error('Failed to fetch trackers');
  return response.json();
};

// Create a new tracker
export const createTracker = async (tracker: any): Promise<any> => {
  const response = await fetch('/api/trackers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tracker),
  });
  if (!response.ok) throw new Error('Failed to create tracker');
  return response.json();
};

// Update a tracker
export const updateTracker = async (id: string, updates: any): Promise<any> => {
  const response = await fetch(`/api/trackers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update tracker');
  return response.json();
};

// Delete a tracker
export const deleteTracker = async (id: string): Promise<void> => {
  const response = await fetch(`/api/trackers/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete tracker');
};

// Fetch detections for a tracker
export const getDetections = async (trackerId: string): Promise<any[]> => {
  const response = await fetch(`/api/trackers/${trackerId}/detections`);
  if (!response.ok) throw new Error('Failed to fetch detections');
  return response.json();
};

// Add a detection
export const addDetection = async (detection: any): Promise<any> => {
  const response = await fetch(`/api/trackers/${detection.tracker_id}/detections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(detection),
  });
  if (!response.ok) throw new Error('Failed to add detection');
  return response.json();
};
