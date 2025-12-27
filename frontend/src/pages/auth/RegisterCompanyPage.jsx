import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Building2, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthLayout } from '../../components/layout';
import { Button, Input, Textarea } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

export function RegisterCompanyPage() {
  const navigate = useNavigate();
  const { registerCompany, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [inviteCode, setInviteCode] = useState('');
  const [formData, setFormData] = useState({
    // Admin info
    name: '',
    email: '',
    password: '',
    // Company info
    companyName: '',
    allowedDomains: '',
  });
  const [errors, setErrors] = useState({});

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) return 'Password must be at least 8 characters';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasSpecialChar) return 'Password must contain at least one special character';
    return null;
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.allowedDomains.trim()) {
      newErrors.allowedDomains = 'At least one domain is required';
    } else {
      const domains = formData.allowedDomains.split(',').map(d => d.trim());
      const invalidDomains = domains.filter(d => !/^@[\w.-]+\.\w+$/.test(d));
      if (invalidDomains.length > 0) {
        newErrors.allowedDomains = 'Invalid domain format. Use @example.com format';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    const domains = formData.allowedDomains.split(',').map(d => d.trim());
    
    const result = await registerCompany({
      adminName: formData.name,
      adminEmail: formData.email,
      adminPassword: formData.password,
      companyName: formData.companyName,
      allowedDomains: domains,
    });

    if (result.success) {
      setInviteCode(result.inviteCode);
      setStep(3);
      toast.success('Company registered successfully!');
    } else {
      toast.error(result.error);
    }
  };

  if (step === 3) {
    return (
      <AuthLayout 
        title="Welcome to GearGuard!" 
        subtitle="Your company has been registered successfully"
      >
        <div className="text-center space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <p className="text-green-800 mb-2">Your invite code is:</p>
            <p className="text-3xl font-mono font-bold text-green-600">{inviteCode}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
            <p className="text-sm text-blue-800 font-medium mb-2">Share this code with your team!</p>
            <p className="text-sm text-blue-600">
              Team members can use this code to join your company when they sign up.
            </p>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title={step === 1 ? "Create Admin Account" : "Set Up Your Company"}
      subtitle={step === 1 ? "Step 1 of 2: Your personal details" : "Step 2 of 2: Company information"}
    >
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          1
        </div>
        <div className={`w-12 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          2
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            icon={User}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              icon={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Password must contain:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
              <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>One uppercase letter</li>
              <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>One lowercase letter</li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : ''}>One special character</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Continue
          </Button>

          <p className="text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Company Name"
            type="text"
            placeholder="Enter your company name"
            icon={Building2}
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            error={errors.companyName}
          />

          <Textarea
            label="Allowed Email Domains"
            placeholder="@example.com, @example.co.in"
            rows={3}
            value={formData.allowedDomains}
            onChange={(e) => setFormData({ ...formData, allowedDomains: e.target.value })}
            error={errors.allowedDomains}
          />
          <p className="text-xs text-gray-500 -mt-3">
            Employees with these email domains can automatically join your company. Separate multiple domains with commas.
          </p>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              className="flex-1" 
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button type="submit" className="flex-1" loading={isLoading}>
              Create Company
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
