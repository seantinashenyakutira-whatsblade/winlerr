import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateLeadPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
    source: 'website',
    tags: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real implementation, this would send data to the backend API
      // For now, we'll simulate a successful creation
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirect to leads list
      router.push('/lead-response');
    } catch (error) {
      console.error('Failed to create lead:', error);
      setErrors({ submit: 'Failed to create lead. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Lead</h1>
              <p className="text-gray-600 mt-1">
                Add a new lead to your pipeline for qualification and response generation
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/lead-response')}
                className="text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Lead'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
              <ul className="mt-2 text-sm text-red-700 list-disc pl-5">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 ${errors.name ? 'border-red-500' : ''} focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-50 px-3 py-2`}
                placeholder="Enter full name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? `error-name` : undefined}
              />
              {errors.name && (
                <p id="error-name" className="mt-1 text-sm text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 ${errors.email ? 'border-red-500' : ''} focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-50 px-3 py-2`}
                placeholder="name@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? `error-email` : undefined}
              />
              {errors.email && (
                <p id="error-email" className="mt-1 text-sm text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 ${errors.company ? 'border-red-500' : ''} focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-50 px-3 py-2`}
                placeholder="Company name"
                aria-invalid={!!errors.company}
                aria-describedby={errors.company ? `error-company` : undefined}
              />
              {errors.company && (
                <p id="error-company" className="mt-1 text-sm text-red-600">
                  {errors.company}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-50 px-3 py-2"
                placeholder="Job title (optional)"
              />
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Source
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-50 px-3 py-2"
              >
                <option value="website">Website Form</option>
                <option value="referral">Referral</option>
                <option value="social_media">Social Media</option>
                <option value="email_campaign">Email Campaign</option>
                <option value="paid_ads">Paid Advertising</option>
                <option value="event">Event or Webinar</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-50 px-3 py-2"
                placeholder="e.g., enterprise, automation, decision-maker"
              />
              <p className="mt-1 text-sm text-gray-500">
                Tags help with lead segmentation and qualification
              </p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              By creating this lead, you agree to our <a href="#" className="text-blue-600 hover:text-blue-800">privacy policy</a>.
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}