import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Shield, Play, Pause, AlertCircle, Search, 
  HelpCircle, CheckCircle, Database, RefreshCw, BarChart, Sparkles,
  Phone, Mail, FileText, ChevronRight, Filter, ExternalLink, X
} from 'lucide-react';

interface SmartTracker {
  id: string;
  tenantId: string;
  name: string;
  businessQuestion: string;
  description?: string;
  type: 'pricing' | 'competitor' | 'objection' | 'risk' | 'custom';
  scope: 'calls' | 'emails' | 'both';
  speakerSide: 'customer' | 'rep' | 'any';
  isPublished: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
  createdAt: string;
  updatedAt: string;
}

interface TrackerDetection {
  id: string;
  trackerId: string;
  callId?: string;
  emailId?: string;
  tenantId: string;
  dealId?: string;
  contactId?: string;
  snippet: string;
  timestampMs?: number;
  confidenceScore: number;
  detectionSource: 'AI Model' | 'Rule-Based Fallback';
  detectedAt: string;
  createdAt: string;
  trackerName?: string;
  trackerType?: string;
}

export default function SmartTrackerDashboard({ apiBaseUrl = 'http://localhost:3001' }: { apiBaseUrl?: string }) {
  // Main data states
  const [trackers, setTrackers] = useState<SmartTracker[]>([]);
  const [detections, setDetections] = useState<TrackerDetection[]>([]);
  
  // UI views & loading states
  const [activeView, setActiveView] = useState<'trackers' | 'detections'>('trackers');
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'completed' | 'failed'>('idle');
  const [scanMessage, setScanMessage] = useState<string>('');
  
  // Modals & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);
  const [editingTracker, setEditingTracker] = useState<SmartTracker | null>(null);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'pricing' | 'competitor' | 'objection' | 'risk' | 'custom'>('custom');
  const [formScope, setFormScope] = useState<'calls' | 'emails' | 'both'>('both');
  const [formSpeaker, setFormSpeaker] = useState<'customer' | 'rep' | 'any'>('any');
  const [validationError, setValidationError] = useState('');

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');

  // Fetch trackers and detections
  const fetchData = async () => {
    setLoading(true);
    let trackersData: SmartTracker[] = [];
    let detectionsData: TrackerDetection[] = [];
    try {
      const headers = { 'x-tenant-id': 'tenant-123' };
      
      const trackersRes = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/trackers`, { headers });
      if (trackersRes.ok) {
        trackersData = await trackersRes.json();
        setTrackers(trackersData);
      }

      const detectionsRes = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/trackers/detections`, { headers });
      if (detectionsRes.ok) {
        detectionsData = await detectionsRes.json();
        setDetections(detectionsData);
      }
    } catch (err) {
      console.error('Error fetching tracker data:', err);
    } finally {
      setLoading(false);
    }
    return { trackers: trackersData, detections: detectionsData };
  };

  useEffect(() => {
    fetchData();
  }, [apiBaseUrl]);

  // Open modal for creating new tracker
  const handleOpenCreate = () => {
    setEditingTracker(null);
    setFormName('');
    setFormQuestion('');
    setFormDescription('');
    setFormType('custom');
    setFormScope('both');
    setFormSpeaker('any');
    setValidationError('');
    setIsModalOpen(true);
  };

  // Open modal for editing tracker
  const handleOpenEdit = (tracker: SmartTracker) => {
    setEditingTracker(tracker);
    setFormName(tracker.name);
    setFormQuestion(tracker.businessQuestion);
    setFormDescription(tracker.description || '');
    setFormType(tracker.type);
    setFormScope(tracker.scope);
    setFormSpeaker(tracker.speakerSide);
    setValidationError('');
    setIsModalOpen(true);
  };

  // Create or Update tracker (Draft or Published)
  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    setValidationError('');
    
    // Strict validations
    if (!formName.trim()) {
      setValidationError('Tracker Name is required');
      return;
    }
    if (!formQuestion.trim()) {
      setValidationError('Business Question description is required');
      return;
    }

    const payload = {
      name: formName.trim(),
      businessQuestion: formQuestion.trim(),
      description: formDescription.trim(),
      type: formType,
      scope: formScope,
      speakerSide: formSpeaker,
      status: status,
      isPublished: status === 'PUBLISHED'
    };

    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-tenant-id': 'tenant-123'
      };

      let res;
      if (editingTracker) {
        res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/trackers/${editingTracker.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/trackers`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
        // If newly published, show scanning notification
        if (status === 'PUBLISHED') {
          setScanStatus('scanning');
          setTimeout(() => setScanStatus('completed'), 2500);
        }
      } else {
        const errData = await res.json();
        setValidationError(errData.message || 'Error occurred while saving tracker.');
      }
    } catch (err) {
      console.error(err);
      setValidationError('Failed to connect to the server.');
    }
  };

  // Toggle publish / unpublish status
  const handleTogglePublish = async (tracker: SmartTracker) => {
    try {
      const headers = { 'x-tenant-id': 'tenant-123' };
      const action = tracker.isPublished ? 'unpublish' : 'publish';
      
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/trackers/${tracker.id}/${action}`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        fetchData();
        if (action === 'publish') {
          setScanStatus('scanning');
          setTimeout(() => setScanStatus('completed'), 2500);
        }
      }
    } catch (err) {
      console.error('Error toggling publish:', err);
    }
  };

  // Delete tracker
  const handleDelete = async (id: string) => {
    try {
      const headers = { 'x-tenant-id': 'tenant-123' };
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/trackers/${id}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setIsDeleteConfirmOpen(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting tracker:', err);
    }
  };

  // Run full detection scanning across conversations manually
  const handleRunScanning = async () => {
    setScanStatus('scanning');
    setScanMessage('Loading published trackers...');
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'x-tenant-id': 'tenant-123' 
      };
      
      // Simulate step 1 transition
      await new Promise(r => setTimeout(r, 600));
      setScanMessage('Retrieving conversation transcripts...');
      await new Promise(r => setTimeout(r, 600));
      setScanMessage('Analyzing signals via Groq AI...');

      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/trackers/scan`, {
        method: 'POST',
        headers
      });
      
      if (res.ok) {
        setScanMessage('Syncing match metrics with database...');
        const data = await fetchData();
        const detectedCount = data.detections ? data.detections.length : 0;
        
        if (detectedCount > 0) {
          setScanStatus('completed');
          setScanMessage(`Scan complete! Matches found: ${detectedCount}`);
        } else {
          setScanStatus('completed');
          setScanMessage('Scan complete. No matches found for current trackers.');
        }
      } else {
        setScanStatus('failed');
        setScanMessage('Scan failed. Please check backend connection.');
      }
    } catch (err) {
      console.error('Scanning error:', err);
      setScanStatus('failed');
      setScanMessage('Scan failed due to a network error.');
    }
  };

  // Filter trackers
  const filteredTrackers = trackers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.businessQuestion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || t.type === typeFilter;
    const matchesScope = !scopeFilter || t.scope === scopeFilter;
    return matchesSearch && matchesType && matchesScope;
  });

  // Filter detections
  const filteredDetections = detections.filter(d => {
    const matchesSearch = (d.trackerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d.snippet || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || d.trackerType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Counts for Stats
  const totalTrackers = trackers.length;
  const publishedTrackers = trackers.filter(t => t.isPublished).length;
  const draftTrackers = trackers.filter(t => !t.isPublished).length;
  const totalDetections = detections.length;
  const highConfidenceDetections = detections.filter(d => d.confidenceScore >= 0.70).length;

  return (
    <div className="rev-results-panel" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Dashboard Header Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-slate)' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles style={{ width: '18px', height: '18px', color: 'var(--accent-purple)' }} />
            AI Smart Tracker
          </h2>
          <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
            Configure smart signal trackers to scan customer transcripts and detect key business conversations
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {scanStatus === 'scanning' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-purple)', fontWeight: '700', background: 'rgba(99, 102, 241, 0.08)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <RefreshCw style={{ width: '13px', height: '13px', animation: 'spin 1.5s linear infinite' }} />
              {scanMessage || 'Analyzing Conversations...'}
            </div>
          )}
          {scanStatus === 'completed' && (
            <div 
              onClick={() => { setScanStatus('idle'); setScanMessage(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#16a34a', fontWeight: '700', background: '#f0fdf4', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', cursor: 'pointer' }}
              title="Click to dismiss"
            >
              <CheckCircle style={{ width: '13px', height: '13px' }} />
              {scanMessage || 'Detections updated!'}
            </div>
          )}
          {scanStatus === 'failed' && (
            <div 
              onClick={() => { setScanStatus('idle'); setScanMessage(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#dc2626', fontWeight: '700', background: '#fef2f2', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.2)', cursor: 'pointer' }}
              title="Click to dismiss"
            >
              <AlertCircle style={{ width: '13px', height: '13px' }} />
              {scanMessage || 'Scan failed'}
            </div>
          )}
          
          <button 
            onClick={handleRunScanning} 
            className="rev-btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '11px' }}
          >
            <RefreshCw style={{ width: '13px', height: '13px' }} />
            Scan conversations
          </button>
          
          <button 
            onClick={handleOpenCreate} 
            className="rev-btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '11px' }}
          >
            <Plus style={{ width: '14px', height: '14px' }} />
            Create Tracker
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <div className="rev-chart-box" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-purple)' }}>
            <Database style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Trackers</span>
            <h4 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-white)' }}>{totalTrackers}</h4>
          </div>
        </div>

        <div className="rev-chart-box" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' }}>
            <CheckCircle style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Published Trackers</span>
            <h4 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-white)' }}>{publishedTrackers} <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>/ {draftTrackers} drafts</span></h4>
          </div>
        </div>

        <div className="rev-chart-box" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(157, 78, 221, 0.1)', color: 'var(--accent-purple)' }}>
            <Shield style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Signals Detected</span>
            <h4 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-white)' }}>{totalDetections}</h4>
          </div>
        </div>

        <div className="rev-chart-box" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.1)', color: '#d97706' }}>
            <BarChart style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>High Quality Matches</span>
            <h4 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-white)' }}>{highConfidenceDetections} <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>(&ge;70%)</span></h4>
          </div>
        </div>
      </div>

      {/* Main Tab bar (Manage Trackers vs Detected Matches) */}
      <div className="rev-tab-bar" style={{ marginBottom: '8px' }}>
        <button 
          onClick={() => { setActiveView('trackers'); setSearchTerm(''); }}
          className={`rev-tab-btn ${activeView === 'trackers' ? 'active' : ''}`}
        >
          Trackers Library ({filteredTrackers.length})
        </button>
        <button 
          onClick={() => { setActiveView('detections'); setSearchTerm(''); }}
          className={`rev-tab-btn ${activeView === 'detections' ? 'active' : ''}`}
        >
          Detection Audits & Alerts ({filteredDetections.length})
        </button>
      </div>

      {/* Search and Filters Strip */}
      <div className="rev-chart-box" style={{ padding: '12px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
        <div className="rev-input-wrapper" style={{ flex: '1', minWidth: '200px' }}>
          <Search style={{ width: '14px', height: '14px', position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder={activeView === 'trackers' ? "Search trackers by name or business question..." : "Search detections by name or snippet..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rev-input"
            style={{ paddingLeft: '32px' }}
          />
        </div>

        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rev-select"
          style={{ width: '160px' }}
        >
          <option value="">All Categories</option>
          <option value="pricing">Pricing</option>
          <option value="competitor">Competitor</option>
          <option value="objection">Objection</option>
          <option value="risk">Risk</option>
          <option value="custom">Custom</option>
        </select>

        {activeView === 'trackers' && (
          <select 
            value={scopeFilter} 
            onChange={(e) => setScopeFilter(e.target.value)}
            className="rev-select"
            style={{ width: '160px' }}
          >
            <option value="">All Scopes</option>
            <option value="calls">Calls Only</option>
            <option value="emails">Emails Only</option>
            <option value="both">Both</option>
          </select>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '10px' }}>
          <RefreshCw style={{ width: '28px', height: '28px', color: 'var(--accent-purple)', animation: 'spin 1.5s linear infinite' }} />
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Fetching trackers data from database...</span>
        </div>
      ) : activeView === 'trackers' ? (
        
        /* TRACKERS LIST VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredTrackers.length === 0 ? (
            <div className="rev-card" style={{ padding: '40px', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '12px' }}>
              <AlertCircle style={{ width: '32px', height: '32px', color: '#94a3b8' }} />
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-white)' }}>No trackers found</h4>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Create a new AI Smart Tracker to start scanning your calls and emails.</p>
              </div>
            </div>
          ) : (
            filteredTrackers.map((t) => {
              const detCount = detections.filter(d => d.trackerId === t.id).length;
              return (
                <div key={t.id} className="rev-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: '1', minWidth: '300px' }}>
                    <div style={{ 
                      padding: '10px', borderRadius: '10px', 
                      background: t.isPublished ? 'rgba(34, 197, 94, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                      color: t.isPublished ? '#16a34a' : '#64748b',
                      marginTop: '2px'
                    }}>
                      {t.scope === 'calls' ? <Phone style={{ width: '18px', height: '18px' }} /> :
                       t.scope === 'emails' ? <Mail style={{ width: '18px', height: '18px' }} /> :
                       <FileText style={{ width: '18px', height: '18px' }} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-white)' }}>{t.name}</h4>
                        <span className="badge-purple-rev" style={{ padding: '1px 6px', fontSize: '8px' }}>{t.type}</span>
                        {t.isPublished ? (
                          <span style={{ fontSize: '9px', fontWeight: '700', color: '#16a34a', background: '#f0fdf4', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '1px 8px', borderRadius: '99px' }}>PUBLISHED</span>
                        ) : (
                          <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 8px', borderRadius: '99px' }}>DRAFT</span>
                        )}
                      </div>
                      
                      <p style={{ fontSize: '12px', color: 'var(--text-slate-300)', fontWeight: '600', marginTop: '6px' }}>
                        <span style={{ color: '#64748b', fontWeight: '700' }}>Question: </span>
                        "{t.businessQuestion}"
                      </p>

                      {t.description && (
                        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{t.description}</p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>
                        <span>Scope: <strong style={{ color: '#64748b' }}>{t.scope}</strong></span>
                        <span>&bull;</span>
                        <span>Speaker Side: <strong style={{ color: '#64748b' }}>{t.speakerSide}</strong></span>
                        <span>&bull;</span>
                        <span>Last Modified: {new Date(t.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Detections</span>
                      <h5 style={{ fontSize: '18px', fontWeight: '800', color: detCount > 0 ? 'var(--accent-purple)' : '#64748b' }}>{detCount}</h5>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        onClick={() => handleTogglePublish(t)} 
                        title={t.isPublished ? 'Pause Tracker' : 'Publish Tracker'}
                        className="rev-btn-secondary" 
                        style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {t.isPublished ? <Pause style={{ width: '13px', height: '13px', color: '#d97706' }} /> : <Play style={{ width: '13px', height: '13px', color: '#16a34a' }} />}
                      </button>

                      <button 
                        onClick={() => handleOpenEdit(t)} 
                        title="Edit Tracker"
                        className="rev-btn-secondary" 
                        style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Edit style={{ width: '13px', height: '13px', color: 'var(--accent-purple)' }} />
                      </button>

                      <button 
                        onClick={() => setIsDeleteConfirmOpen(t.id)} 
                        title="Delete Tracker"
                        className="rev-btn-secondary" 
                        style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: '#fecaca' }}
                      >
                        <Trash2 style={{ width: '13px', height: '13px', color: '#dc2626' }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        
        /* DETECTIONS AUDIT LOG VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredDetections.length === 0 ? (
            <div className="rev-card" style={{ padding: '40px', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '12px' }}>
              <AlertCircle style={{ width: '32px', height: '32px', color: '#94a3b8' }} />
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-white)' }}>No signals detected</h4>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Configure and publish trackers to identify business triggers in conversation transcripts.</p>
              </div>
            </div>
          ) : (
            filteredDetections.map((d) => {
              const confidenceHigh = d.confidenceScore >= 0.70;
              return (
                <div key={d.id} className="rev-card" style={{ flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '800', color: 'var(--text-white)', fontSize: '12px' }}>{d.trackerName}</span>
                      <span className="badge-purple-rev" style={{ padding: '0px 6px', fontSize: '7px' }}>{d.trackerType}</span>
                      <span style={{ color: '#cbd5e1', fontSize: '12px' }}>|</span>
                      {d.callId ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                          <Phone style={{ width: '11px', height: '11px' }} /> Call review (Matched)
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                          <Mail style={{ width: '11px', height: '11px' }} /> Email thread (Matched)
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '9px', fontWeight: '800', 
                        padding: '2px 8px', borderRadius: '99px',
                        background: confidenceHigh ? '#f0fdf4' : '#fffbeb',
                        color: confidenceHigh ? '#16a34a' : '#d97706',
                        border: confidenceHigh ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                      }}>
                        {Math.round(d.confidenceScore * 100)}% Conf ({confidenceHigh ? 'High' : 'Low'})
                      </span>

                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                        {new Date(d.detectedAt).toLocaleDateString()} {new Date(d.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Snippet display with styling */}
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--text-slate-300)', lineHeight: '1.5', borderLeft: '3px solid var(--accent-purple)' }}>
                    "{d.snippet}"
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CREATE & EDIT TRACKER MODAL */}
      {isModalOpen && (
        <div className="rev-dialog-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="rev-dialog-sheet" style={{ maxWidth: '600px', height: 'auto', maxHeight: '90vh' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-slate)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles style={{ width: '16px', height: '16px', color: 'var(--accent-purple)' }} />
                {editingTracker ? 'Edit Smart Tracker' : 'Create Smart Tracker'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              
              {validationError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#dc2626', fontWeight: '700' }}>
                  <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                  {validationError}
                </div>
              )}

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Tracker Name</label>
                <input
                  type="text"
                  placeholder="e.g. Competitor Mention: Gong"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="rev-input"
                />
              </div>

              {/* Business Question */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Business Question Description</label>
                <textarea
                  placeholder="Describe the business question or semantic intent the AI model should look for. e.g. Does the customer mention Gong or other recording competitors?"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  className="rev-input"
                  rows={3}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Describe internal purposes of this tracker"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="rev-input"
                />
              </div>

              {/* Grid selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Type</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value as any)} className="rev-select">
                    <option value="custom">Custom</option>
                    <option value="pricing">Pricing</option>
                    <option value="competitor">Competitor</option>
                    <option value="objection">Objection</option>
                    <option value="risk">Risk</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Scope</label>
                  <select value={formScope} onChange={(e) => setFormScope(e.target.value as any)} className="rev-select">
                    <option value="both">Both</option>
                    <option value="calls">Calls only</option>
                    <option value="emails">Emails only</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Speaker Side</label>
                  <select value={formSpeaker} onChange={(e) => setFormSpeaker(e.target.value as any)} className="rev-select">
                    <option value="any">Any party</option>
                    <option value="customer">Customer only</option>
                    <option value="rep">Representative only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', padding: '16px 24px', borderTop: '1px solid var(--border-slate)', background: '#f8fafc' }}>
              <button onClick={() => setIsModalOpen(false)} className="rev-btn-secondary" style={{ padding: '8px 16px' }}>
                Cancel
              </button>
              
              <button onClick={() => handleSave('DRAFT')} className="rev-btn-secondary" style={{ padding: '8px 16px', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}>
                Save as Draft
              </button>
              
              <button onClick={() => handleSave('PUBLISHED')} className="rev-btn-primary" style={{ padding: '8px 16px' }}>
                Publish Tracker
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION POPUP */}
      {isDeleteConfirmOpen && (
        <div className="rev-dialog-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="rev-dialog-sheet" style={{ maxWidth: '400px', height: 'auto' }}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ padding: '12px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626' }}>
                <Trash2 style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-white)' }}>Delete Smart Tracker?</h4>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: '1.5' }}>
                  This action is permanent. All historical detections matching this tracker will also be removed from the portal database.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
                <button onClick={() => setIsDeleteConfirmOpen(null)} className="rev-btn-secondary" style={{ flex: '1', padding: '10px' }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(isDeleteConfirmOpen)} className="rev-btn-primary" style={{ flex: '1', padding: '10px', background: '#dc2626' }}>
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add spin animation locally */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />

    </div>
  );
}
