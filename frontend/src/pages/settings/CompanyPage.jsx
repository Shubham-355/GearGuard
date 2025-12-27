import { useState, useEffect } from 'react';
import { Building2, Mail, Plus, X, Save } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { Card, CardHeader, CardContent, Button, Input, Spinner } from '../../components/ui';
import { companyAPI } from '../../services/api';
import toast from 'react-hot-toast';

export function CompanyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [allowedDomains, setAllowedDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.get();
      const companyData = response.data.data;
      setCompany(companyData);
      setAllowedDomains(companyData.allowedDomains || []);
    } catch (error) {
      toast.error('Failed to load company information');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain');
      return;
    }

    // Ensure domain starts with @
    const domain = newDomain.trim().startsWith('@') ? newDomain.trim() : `@${newDomain.trim()}`;

    // Validate domain format (basic)
    const domainRegex = /^@[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      toast.error('Invalid domain format (e.g., @company.com)');
      return;
    }

    if (allowedDomains.includes(domain)) {
      toast.error('Domain already exists');
      return;
    }

    setAllowedDomains([...allowedDomains, domain]);
    setNewDomain('');
  };

  const handleRemoveDomain = (domain) => {
    if (allowedDomains.length <= 1) {
      toast.error('At least one domain is required');
      return;
    }
    setAllowedDomains(allowedDomains.filter(d => d !== domain));
  };

  const handleSave = async () => {
    if (allowedDomains.length === 0) {
      toast.error('At least one domain is required');
      return;
    }

    setSaving(true);
    try {
      await companyAPI.updateAllowedDomains({ allowedDomains });
      toast.success('Email domains updated successfully');
      setIsEditing(false);
      fetchCompany();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update domains');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setAllowedDomains(company?.allowedDomains || []);
    setNewDomain('');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-500">Manage your company information and email domains</p>
        </div>

        {/* Company Information */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                <p className="text-sm text-gray-500">Basic details about your company</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Company Name</label>
                <p className="text-lg text-gray-900 mt-1">{company?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Invite Code</label>
                <p className="text-lg text-gray-900 mt-1 font-mono font-semibold">{company?.inviteCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allowed Email Domains */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Allowed Email Domains</h3>
                  <p className="text-sm text-gray-500">
                    Users with these email domains can automatically join your company
                  </p>
                </div>
              </div>
              {!isEditing && (
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Domains
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                {/* Domain List */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Current Domains</label>
                  {allowedDomains.length > 0 ? (
                    <div className="space-y-2">
                      {allowedDomains.map((domain, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-gray-900">{domain}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveDomain(domain)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Remove domain"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No domains added yet</p>
                  )}
                </div>

                {/* Add New Domain */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Add New Domain</label>
                  <div className="flex gap-2">
                    <Input
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="@company.com"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                    />
                    <Button type="button" onClick={handleAddDomain} variant="secondary">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter domain with @ prefix (e.g., @company.com, @company.co.in)
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Users with email addresses matching these domains will be able to
                    register and automatically join your company. Make sure to only add trusted domains.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="secondary" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {allowedDomains.map((domain, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                  >
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-gray-900">{domain}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
