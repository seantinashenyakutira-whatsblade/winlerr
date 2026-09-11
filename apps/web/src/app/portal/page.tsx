"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useRouter } from 'next/navigation';
import styles from './portal.module.css';

// Mock data for demonstration - in real implementation these would come from API calls
const [organizations, setOrganizations] = useState([
  { id: '1', name: 'Northstar Studio', slug: 'northstar-studio', status: 'active' },
  { id: '2', name: 'BrightFuture Agency', slug: 'brightfuture-agency', status: 'pending' },
]);

const [productRequests, setProductRequests] = useState([
  { id: '1', organizationId: '1', productName: 'Lead Response', requirements: 'Need automated lead qualification and response system', status: 'submitted', createdAt: '2025-09-01' },
  { id: '2', organizationId: '1', productName: 'Website System', requirements: 'Need a responsive business website with contact forms', status: 'in-review', createdAt: '2025-09-05' },
]);

const handleCreateOrganization = (event: FormEvent) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const name = (form.elements.namedItem('orgName') as HTMLInputElement).value;
  const businessType = (form.elements.namedItem('businessType') as HTMLSelectElement).value;
  const industry = (form.elements.namedItem('industry') as HTMLInputElement).value;
  const country = (form.elements.namedItem('country') as HTMLSelectElement).value;

  // Simulate API call
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const newOrg = {
    id: Date.now().toString(),
    name,
    slug,
    businessType,
    industry,
    country,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  };

  setOrganizations([...organizations, newOrg]);
  // In real implementation: await createOrganization(newOrg);
};

const handleCreateProductRequest = (event: FormEvent, organizationId: string) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const productName = (form.elements.namedItem('productName') as HTMLSelectElement).value;
  const requirements = (form.elements.namedItem('requirements') as HTMLTextAreaElement).value;
  const businessName = (form.elements.namedItem('businessName') as HTMLInputElement).value;
  const contactName = (form.elements.namedItem('contactName') as HTMLInputElement).value;
  const contactEmail = (form.elements.namedItem('contactEmail') as HTMLInputElement).value;
  const contactPhone = (form.elements.namedItem('contactPhone') as HTMLInputElement).value;
  const priority = (form.elements.namedItem('priority') as HTMLSelectElement).value;

  // Simulate API call
  const newRequest = {
    id: Date.now().toString(),
    organizationId,
    productName,
    requirements,
    businessName,
    contactName,
    contactEmail,
    contactPhone,
    status: 'submitted',
    priority,
    createdAt: new Date().toISOString().split('T')[0],
    submittedBy: 'current-user-id',
    submittedByEmail: 'user@example.com',
  };

  setProductRequests([...productRequests, newRequest]);
  // In real implementation: await createProductRequest(newRequest);
};

const handleSubmitRequirements = (event: FormEvent, organizationId: string) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const requirements = (form.elements.namedItem('fullRequirements') as HTMLTextAreaElement).value;
  const goals = (form.elements.namedItem('businessGoals') as HTMLTextAreaElement).value;
  const existingTools = (form.elements.namedItem('existingTools') as HTMLTextAreaElement).value;
  const customization = (form.elements.namedItem('customization') as HTMLTextAreaElement).value;
  const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value;

  // Update existing request or create new one
  const organizationRequests = productRequests.filter(req => req.organizationId === organizationId);
  if (organizationRequests.length > 0) {
    const updatedRequests = productRequests.map(req => {
      if (req.organizationId === organizationId) {
        return {
          ...req,
          requirements: req.requirements + '\n\nFull Requirements: ' + requirements,
          businessGoals: goals,
          existingTools: existingTools,
          customization: customization,
          notes: notes,
          status: 'reviewing',
        };
      }
      return req;
    });
    setProductRequests(updatedRequests);
    // In real implementation: await updateProductRequest({...});
  }
};

export default function PortalPage() {
  const [userOrganizations, setUserOrganizations] = useState([
    { id: '1', name: 'Northstar Studio', slug: 'northstar-studio', role: 'owner' },
  ]);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showRequirementsForm, setShowRequirementsForm] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);

  const router = useRouter();

  // In real implementation, check authentication status
  const isAuthenticated = true;

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const userProductRequests = selectedOrganization
    ? productRequests.filter(req => req.organizationId === selectedOrganization.id)
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'in-review': return 'bg-blue-100 text-blue-800';
      case 'reviewing': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <main className="portal">
      <div className="portal-layout">
        <aside className="sidebar">
          <a className="brand" href="/"><span className="brand-mark">W/</span> winlerr</a>
          <nav className="sidebar-nav" aria-label="Client portal navigation">
            <a href="/portal" className="active">Overview<span aria-hidden="true">•</span></a>
            <a href="/portal#organizations">Organizations</a>
            <a href="/portal#systems">My systems</a>
            <a href="/portal#requests">Requests</a>
            <a href="/portal#settings">Settings</a>
          </nav>
          <div className="sidebar-footer">
            <p>WinlaOS is the client operating layer for your Winlerr systems.</p>
            <button
              onClick={() => setShowCreateOrg(true)}
              className="button-primary mt-3 w-full"
            >
              New organization
            </button>
          </div>
        </aside>

        <section className="portal-main">
          <div className="portal-top">
            <div>
              <span className="eyebrow">WinlaOS / Overview</span>
              <h1>Welcome to your WinlaOS workspace</h1>
              <p>Manage your business systems, organizations, and requests from one place.</p>
            </div>
          </div>

          {/* Organizations Section */}
          <section id="organizations" className="portal-card mb-6">
            <h2>Your Organizations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userOrganizations.map((org) => (
                <div
                  key={org.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedOrganization(org)}
                >
                  <h3 className="font-semibold text-lg mb-2">{org.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">/{org.slug}</p>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {org.status}
                    </span>
                    <span className="text-xs text-gray-500">Role: {org.role}</span>
                  </div>
                </div>
              ))}
            </div>
            {showCreateOrg && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold mb-3">Create New Organization</h3>
                <form onSubmit={handleCreateOrganization} className="space-y-3">
                  <div>
                    <label htmlFor="orgName" className="block text-sm font-medium mb-1">Organization Name</label>
                    <input type="text" id="orgName" name="orgName" required placeholder="Acme Corp" className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium mb-1">Business Type</label>
                    <select id="businessType" name="businessType" className="w-full p-2 border rounded">
                      <option value="service">Service Business</option>
                      <option value="product">Product Business</option>
                      <option value="consulting">Consulting</option>
                      <option value="agency">Agency</option>
                      <option value="startup">Startup</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium mb-1">Industry</label>
                    <input type="text" id="industry" name="industry" placeholder="Technology, Marketing, etc." className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium mb-1">Country</label>
                    <select id="country" name="country" className="w-full p-2 border rounded">
                      <option value="ZA">South Africa</option>
                      <option value="ZW">Zimbabwe</option>
                      <option value="BW">Botswana</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="button-primary">Create Organization</button>
                    <button
                      type="button"
                      onClick={() => setShowCreateOrg(false)}
                      className="button-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>

          {/* Selected Organization Details */}
          {selectedOrganization && (
            <section className="portal-card mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2>Organization: {selectedOrganization.name}</h2>
                <button
                  onClick={() => setSelectedOrganization(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back to list
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Organization Details</h3>
                  <p><strong>Slug:</strong> /{selectedOrganization.slug}</p>
                  <p><strong>Status:</strong> {selectedOrganization.status}</p>
                  <p><strong>Role:</strong> {selectedOrganization.role}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Product Requests</h3>
                  {userProductRequests.length === 0 ? (
                    <div className="text-gray-500">No product requests yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {userProductRequests.map((request) => (
                        <div key={request.id} className="border rounded p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{request.productName}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>{request.status}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{request.requirements.substring(0, 100)}...</p>
                          <p className="text-xs text-gray-500">Created: {request.createdAt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowCreateRequest(true)}
                  className="button-primary"
                >
                  Create Product Request
                </button>
              </div>
            </section>
          )}

          {/* Create Product Request Modal */}
          {showCreateRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Create Product Request</h2>
                <form onSubmit={(e) => handleCreateProductRequest(e, selectedOrganization?.id || 'new-org')}
                  className="space-y-4">
                  <div>
                    <label htmlFor="productName" className="block text-sm font-medium mb-1">Product of Interest</label>
                    <select id="productName" name="productName" required className="w-full p-2 border rounded">
                      <option value="Lead Response">Lead Response</option>
                      <option value="CRM Lite">CRM Lite</option>
                      <option value="Booking System">Booking System</option>
                      <option value="Social Agent">Social Agent</option>
                      <option value="Website System">Website System</option>
                      <option value="Not sure yet">Not sure yet</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="requirements" className="block text-sm font-medium mb-1">Initial Requirements</label>
                    <textarea id="requirements" name="requirements" rows={3} required placeholder="Brief overview of what you need..." className="w-full p-2 border rounded" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-medium mb-1">Business Name</label>
                      <input type="text" id="businessName" name="businessName" required className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label htmlFor="contactName" className="block text-sm font-medium mb-1">Contact Name</label>
                      <input type="text" id="contactName" name="contactName" required className="w-full p-2 border rounded" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contactEmail" className="block text-sm font-medium mb-1">Contact Email</label>
                      <input type="email" id="contactEmail" name="contactEmail" required className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label htmlFor="contactPhone" className="block text-sm font-medium mb-1">Contact Phone</label>
                      <input type="tel" id="contactPhone" name="contactPhone" className="w-full p-2 border rounded" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium mb-1">Priority</label>
                    <select id="priority" name="priority" className="w-full p-2 border rounded">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="button-primary">Submit Request</button>
                    <button
                      type="button"
                      onClick={() => setShowCreateRequest(false)}
                      className="button-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Requests Section */}
          <section id="requests" className="portal-card">
            <h2>System Requests</h2>
            <div className="space-y-4">
              {productRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{request.productName}</h3>
                      <p className="text-sm text-gray-600">Organization: {userOrganizations.find(org => org.id === request.organizationId)?.name}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(request.status)}`}>{request.status}</span>
                  </div>
                  <p className="text-gray-700 mb-3">{request.requirements}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Contact: {request.contactName} ({request.contactEmail})</span>
                    <span>Submitted: {request.createdAt}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">View details</button>
                    {request.status === 'submitted' && (
                      <button
                        onClick={() => {
                          setSelectedOrganization(userOrganizations.find(org => org.id === request.organizationId) || null);
                          setShowRequirementsForm(true);
                        }}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Add requirements
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {productRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">No system requests yet.</p>
                  <button
                    onClick={() => setSelectedOrganization(userOrganizations[0] || null)
                  }
                    className="button-primary"
                  >
                    Create your first request
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Requirements Form Modal */}
          {showRequirementsForm && selectedOrganization && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Provide Full Requirements</h2>
                <p className="text-gray-600 mb-6">
                  Tell us more about your needs for this product request. This will help us understand
                  what you need and shape the best solution for your business.
                </p>
                <form onSubmit={(e) => handleSubmitRequirements(e, selectedOrganization.id)}
                  className="space-y-5">
                  <div>
                    <label htmlFor="fullRequirements" className="block text-sm font-medium mb-2">
                      What specific problems are you trying to solve?
                    </label>
                    <textarea
                      id="fullRequirements"
                      name="fullRequirements"
                      rows={4}
                      required
                      placeholder="Describe the specific challenges and pain points you want this system to address..."
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="businessGoals" className="block text-sm font-medium mb-2">
                      What are your business goals for this system?
                    </label>
                    <textarea
                      id="businessGoals"
                      name="businessGoals"
                      rows={3}
                      placeholder="E.g., save time, increase efficiency, improve customer experience, etc."
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="existingTools" className="block text-sm font-medium mb-2">
                      What tools do you currently use? (Any we should integrate with)
                    </label>
                    <textarea
                      id="existingTools"
                      name="existingTools"
                      rows={3}
                      placeholder="E.g., existing CRM, email marketing, accounting software, etc."
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="customization" className="block text-sm font-medium mb-2">
                      Any specific requirements or customizations needed?
                    </label>
                    <textarea
                      id="customization"
                      name="customization"
                      rows={3}
                      placeholder="E.g., specific branding, workflows, integrations, etc."
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium mb-2">
                      Any additional notes for the Winlerr team?
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={2}
                      placeholder="Anything else we should know..."
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <button type="submit" className="button-primary px-8">Submit Requirements</button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRequirementsForm(false);
                        setSelectedOrganization(null);
                      }}
                      className="button-secondary px-8"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}