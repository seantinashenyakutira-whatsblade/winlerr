"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const [leads, setLeads] = useState([
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@johnson.dev',
    company: 'TechFlow Solutions',
    title: 'CTO',
    status: 'new',
    priority: 'high',
    qualificationScore: 85,
    organizationId: 'org1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael@zenith.com',
    company: 'Zenith Marketing',
    title: 'Marketing Director',
    status: 'qualified',
    priority: 'medium',
    qualificationScore: 65,
    organizationId: 'org1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily@creative.co',
    company: 'Creative Agency',
    title: 'Owner',
    status: 'responding',
    priority: 'high',
    qualificationScore: 72,
    organizationId: 'org1',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
]);

const [organizationLeads, setOrganizationLeads] = useState(leads);

const router = useRouter();

// Mock user data
const currentUser = {
  id: 'user1',
  email: 'admin@winlerr.com',
  organizations: ['org1', 'org2'],
};

const [userOrganization, setUserOrganization] = useState('org1');

// Filter leads by current user organization
useEffect(() => {
  const filteredLeads = leads.filter(lead => lead.organizationId === userOrganization);
  setOrganizationLeads(filteredLeads);
}, [userOrganization, leads]);

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
    'high': 'border-red-500 bg-red-50',
    'medium': 'border-yellow-500 bg-yellow-50',
    'low': 'border-green-500 bg-green-50',
  };
  return colors[priority] || 'border-gray-500 bg-gray-50';
};

const handleCreateLead = () => {
  router.push('/lead-response/leads/create');
};

const handleLeadClick = (leadId: string) => {
  router.push(`/lead-response/leads/${leadId}`);
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export default function LeadResponseDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Winlerr Lead Response</h1>
              <p className="text-sm text-gray-600">AI-powered lead management system</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={userOrganization}
                onChange={(e) => setUserOrganization(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="org1">Northstar Studio</option>
                <option value="org2">BrightFuture Agency</option>
              </select>
              <button
                onClick={handleCreateLead}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Create Lead
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Leads</h3>
            <p className="text-3xl font-bold text-gray-900">{organizationLeads.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">New Leads</h3>
            <p className="text-3xl font-bold text-blue-600">
              {organizationLeads.filter((lead) => lead.status === 'new').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Qualified</h3>
            <p className="text-3xl font-bold text-green-600">
              {organizationLeads.filter((lead) => lead.status === 'qualified').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">High Priority</h3>
            <p className="text-3xl font-bold text-red-600">
              {organizationLeads.filter((lead) => lead.priority === 'high').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qualification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {organizationLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleLeadClick(lead.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.company}</div>
                      <div className="text-sm text-gray-500">{lead.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded-full ${getPriorityColor(lead.priority)}`}
                      >
                        {lead.priority} priority
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${getScoreColor(lead.qualificationScore)}`}>{
                          lead.qualificationScore
                        }</span>
                        <span className="text-xs text-gray-500 ml-1">/100</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
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