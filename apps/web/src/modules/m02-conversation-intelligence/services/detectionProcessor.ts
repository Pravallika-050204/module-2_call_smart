import { getTrackers, addDetection } from './trackerService';

const processDetections = async (): Promise<void> => {
  const trackers = await getTrackers();
  const publishedTrackers = trackers.filter((tracker: any) => tracker.is_published);

  for (const tracker of publishedTrackers) {
    try {
      const response = await fetch('/internal/detect-trackers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackerId: tracker.id })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to detect trackers: ${response.statusText}`);
      }

      const data = await response.json();
      const detections = data.detections;

      for (const detection of detections) {
        await addDetection({
          tracker_id: tracker.id,
          call_id: detection.callId,
          email_id: detection.emailId,
          tenant_id: detection.tenantId,
          deal_id: detection.dealId,
          contact_id: detection.contactId,
          snippet: detection.snippet,
          timestamp_ms: detection.timestampMs,
          confidence_score: detection.confidenceScore,
          detection_source: detection.source,
          detected_at: detection.detectedAt,
        });
      }
    } catch (error) {
      console.error(`Failed to process tracker ${tracker.id}:`, error);
    }
  }
};

export default processDetections;