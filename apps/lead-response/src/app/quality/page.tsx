"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadQualityPage() {
  const router = useRouter();

  // Mock data for demonstration
  const [leads, setLeads] = useState([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@johnson.dev',
      company: 'TechFlow Solutions',
      title: 'CTO',
      qualificationScore: 85,
      status: 'new',
      priority: 'high',
      organizationId: 'org1',
      tags: ['enterprise', 'automation'],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael@zenith.com',
      company: 'Zenith Marketing',
      title: 'Marketing Director',
      qualificationScore: 65,
      status: 'qualified',
      priority: 'medium',
      organizationId: 'org1',
      tags: ['mid-market', 'marketing'],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily@creative.co',
      company: 'Creative Agency',
      title: 'Owner',
      qualificationScore: 72,
      status: 'responding',
      priority: 'high',
      organizationId: 'org1',
      tags: ['small-business', 'creative'],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      name: 'David Osei',
      email: 'david@impact.co.za',
      company: 'Impact Consulting',
      title: 'Founder & CEO',
      qualificationScore: 45,
      status: 'new',
      priority: 'medium',
      organizationId: 'org1',
      tags: ['startup', 'consulting'],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    minScore: '',
    organizationId: 'org1',
  });

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const filteredLeads = leads.filter((lead) => {
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.priority && lead.priority !== filters.priority) return false;
    if (filters.minScore && lead.qualificationScore < parseInt(filters.minScore))
      return false;
    return true;
  });

  const handleLeadClick = (leadId: string) => {
    router.push(`/lead-response/leads/${leadId}`);
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map((lead) => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleStatusChange = (leadId: string, newStatus: string) => {
    setLeads(
      leads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            }
          : lead
      )
    );
  };

  const handleGenerateResponses = () => {
    // In real implementation, this would trigger AI response generation
    // For now, show a notification
    alert(
      `AI response generation would be triggered for ${selectedLeads.length} leads`
    );
    setSelectedLeads([]);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'qualified': 'bg-green-100 text-green-800',
      'responding': 'bg-yellow-100 text-yellow-800',
      'closed': 'bg-gray-100 text-gray-800',
      'lost': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-semibold';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarWidth = (score: number) => {
    return `${score}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lead Quality Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Qualify, score, and prioritize leads for response generation
              </p>
            </div>
            <div className="flex gap-3">
              {selectedLeads.length > 0 && (
                <button
                  onClick={handleGenerateResponses}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Generate AI Responses ({selectedLeads.length})
                </button>
              )}
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Create Lead
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="qualified">Qualified</option>
                <option value="responding">Responding</option>
                <option value="closed">Closed</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
              <select
                value={filters.minScore}
                onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Any Score</option>
                <option value="80">80+ (Hot)</option>
                <option value="60">60+ (Warm)</option>
                <option value="40">40+ (Cool)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', priority: '', minScore: '', organizationId: 'org1' })}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Leads</h3>
            <p className="text-3xl font-bold text-gray-900">
              {filteredLeads.length}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Hot Leads (80+)</h3>
            <p className="text-3xl font-bold text-green-600">
              {filteredLeads.filter((l) => l.qualificationScore >= 80).length}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Qualified</h3>
            <p className="text-3xl font-bold text-blue-600">
              {filteredLeads.filter((l) => l.status === 'qualified').length}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">High Priority</h3>
            <p className="text-3xl font-bold text-red-600">
              {filteredLeads.filter((l) => l.priority === 'high').length}
            </p>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
              <div className="text-sm text-gray-600">
                {filteredLeads.length} leads
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qualification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => handleLeadClick(lead.id)}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-600">
                            {lead.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                            {lead.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lead.company}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleLeadClick(lead.id)}>
                      <div className="flex items-center mb-1">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: getScoreBarWidth(lead.qualificationScore) }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getScoreColor(lead.qualificationScore)}`}>{lead.qualificationScore}</span>
                      </div>
                      <div className="text-xs text-gray-500">Qualification Score</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleLeadClick(lead.id)}>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}
                      >
                        {lead.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleLeadClick(lead.id)}>
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded-full ${getPriorityColor(lead.priority)}`}
                      >
                        {lead.priority} priority
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleLeadClick(lead.id)}>
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
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={() => handleLeadClick(lead.id)}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLeadClick(lead.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="new">New</option>
                          <option value="qualified">Qualified</option>
                          <option value="responding">Responding</option>
                          <option value="closed">Closed</option>
                          <option value="lost">Lost</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}