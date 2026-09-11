import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const leadId = params.id;

  // Mock lead data - in real app, this would come from API
  const [lead, setLead] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responseDraft, setResponseDraft] = useState('');
  const [proposalVisible, setProposalVisible] = useState(false);

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      // Mock data based on leadId
      const mockLead = {
        id: leadId,
        name: 'Sarah Johnson',
        email: 'sarah@johnson.dev',
        company: 'TechFlow Solutions',
        title: 'CTO',
        source: 'website',
        tags: ['enterprise', 'automation', 'decision-maker'],
        status: 'qualified',
        priority: 'high',
        qualificationScore: 85,
        organizationId: 'org1',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      };

      const mockEvents = [
        {
          id: 'evt1',
          type: 'lead_created',
          description: 'Lead created via website form',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          user: 'system',
        },
        {
          id: 'evt2',
          type: 'status_change',
          description: 'Status changed from new to qualified',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          user: 'admin@winlerr.com',
          metadata: { from: 'new', to: 'qualified' },
        },
        {
          id: 'evt3',
          type: 'note_added',
          description: 'Added note: Interested in automation solutions for their dev team',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          user: 'admin@winlerr.com',
        },
      ];

      setLead(mockLead);
      setEvents(mockEvents);
      setIsLoading(false);
    }, 800);
  }, [leadId]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'qualified': 'bg-green-100 text-green-800',
      'responding': 'bg-yellow-100 text-yellow-800',
      'proposed': 'bg-purple-100 text-purple-800',
      'closed': 'bg-gray-100 text-gray-800',
      'lost': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'border-red-500 bg-red-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-green-500 bg-green-50',
    };
    return colors[priority] || 'border-gray-500 bg-gray-50';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleStatusChange = (newStatus: string) => {
    // In real app, this would be an API call
    setLead(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
    });

    // Add event
    setEvents(prev => [
      ...prev,
      {
        id: `evt${Date.now()}`,
        type: 'status_change',
        description: `Status changed from ${lead?.status} to ${newStatus}`,
        timestamp: new Date().toISOString(),
        user: 'admin@winlerr.com',
        metadata: { from: lead?.status, to: newStatus },
      },
    ]);
  };

  const handleGenerateResponse = () => {
    // In real app, this would call AI service
    setResponseDraft(`Hi ${lead?.name},

Thank you for reaching out to ${lead?.company}. I've reviewed your inquiry about our automation solutions and would love to schedule a call to discuss how we can help streamline your development team's workflow.

Our platform specializes in helping companies like ${lead?.company} automate repetitive tasks, improve deployment frequency, and reduce time-to-market for new features.

Would you be available for a 30-minute call this week to explore your specific needs?

Best regards,
Winlerr Team`);

    setProposalVisible(true);

    // Add event
    setEvents(prev => [
      ...prev,
      {
        id: `evt${Date.now()}`,
        type: 'response_generated',
        description: 'AI response proposal generated',
        timestamp: new Date().toISOString(),
        user: 'system',
      },
    ]);
  };

  const handleApproveResponse = () => {
    // In real app, this would save the response
    setEvents(prev => [
      ...prev,
      {
        id: `evt${Date.now()}`,
        type: 'response_approved',
        description: 'Response proposal approved and sent',
        timestamp: new Date().toISOString(),
        user: 'admin@winlerr.com',
      },
    ]);

    setLead(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'responding',
        updatedAt: new Date().toISOString(),
      };
    });

    setProposalVisible(false);
    setResponseDraft('');
  };

  const handleRejectResponse = () => {
    setEvents(prev => [
      ...prev,
      {
        id: `evt${Date.now()}`,
        type: 'response_rejected',
        description: 'Response proposal rejected',
        timestamp: new Date().toISOString(),
        user: 'admin@winlerr.com',
      },
    ]);

    setProposalVisible(false);
    setResponseDraft('');
  };

  const handleAddNote = () => {
    const note = prompt('Add a note to this lead:');
    if (note !== null && note.trim() !== '') {
      setEvents(prev => [
        ...prev,
        {
          id: `evt${Date.now()}`,
          type: 'note_added',
          description: note,
          timestamp: new Date().toISOString(),
          user: 'admin@winlerr.com',
        },
      ]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="animate-spin rounded-full border-4 border-blue-500 border-t-transparent h-12 w-12"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <p className="text-gray-500">Lead not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
              <p className="text-gray-600 mt-1">{lead.company} • {lead.title}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/lead-response')}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Leads
              </button>
              <button
                onClick={() => router.push(`/lead-response/leads/${leadId}/edit`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Edit Lead
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lead Overview */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status */}
              <div>
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3 bg-blue-100 text-blue-800">
                    <span className="text-xs font-medium">{lead.status.charAt(0).toUpperCase()}{lead.status.slice(1)}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Status</span>
                </div>
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="mt-2 block w-full rounded-md border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="new">New</option>
                  <option value="qualified">Qualified</option>
                  <option value="responding">Responding</option>
                  <option value="proposed">Proposed</option>
                  <option value="closed">Closed</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3">
                    <span className={`text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                      {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Priority</span>
                </div>
                <select
                  value={lead.priority}
                  onChange={(e) => handleStatusChange(e.target.value)} // Reuse for simplicity
                  className="mt-2 block w-full rounded-md border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Qualification Score */}
              <div>
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3">
                    <span className={`text-xs font-medium ${getScoreColor(lead.qualificationScore)}`}>
                      {lead.qualificationScore}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Qualification Score</span>
                </div>
                <div className="mt-2 w-full">
                  <div className="bg-gray-200 rounded-full h-2.5 mb-1">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full"
                      style={{ width: `${lead.qualificationScore}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    {lead.qualificationScore}/100
                  </p>
                </div>
              </div>
            </div>

            {/* Lead Details */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                  <p className="text-sm text-gray-900 truncate">{lead.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Source</p>
                  <p className="text-sm text-gray-900 capitalize">{lead.source}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {lead.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Organization</p>
                  <p className="text-sm text-gray-900">Northstar Studio</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
                  <p className="text-sm text-gray-900">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Updated</p>
                  <p className="text-sm text-gray-900">
                    {new Date(lead.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Response Generation Section */}
        {proposalVisible && (
          <div className="bg-white rounded-lg border border-gray-200 mb-8">
            <div className="px-6 py-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Response Proposal</h2>
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <p className="whitespace-pre-line text-gray-800">{responseDraft}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApproveResponse}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Approve & Send
                </button>
                <button
                  onClick={handleRejectResponse}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => setResponseDraft('')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events Timeline */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Timeline</h2>
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border-l-2 border-blue-500 pl-4 mb-4"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-medium text-gray-900">
                        {event.type
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{event.description}</p>
                  {event.metadata && (
                    <div className="mt-1 text-xs text-gray-500">
                      {JSON.stringify(event.metadata)}
                    </div>
                  )}
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No events recorded yet.
                </p>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleAddNote}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>+</span>
                <span>Add Note</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}