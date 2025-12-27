import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthLayout } from '../../components/layout';
import { Button, Input, Tabs } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, joinWithCode, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
  });
  const [errors, setErrors] = useState({});

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'Password must be at least 8 characters';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (activeTab === 'email') {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    } else {
      if (!formData.inviteCode) {
        newErrors.inviteCode = 'Invite code is required';
      } else if (!/^GG-[A-Z]+-\d{4}$/.test(formData.inviteCode)) {
        newErrors.inviteCode = 'Invalid invite code format (e.g., GG-ACME-9342)';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    let result;
    if (activeTab === 'email') {
      result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    } else {
      result = await joinWithCode({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        inviteCode: formData.inviteCode,
      });
    }

    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  const tabs = [
    { id: 'email', label: 'Email Domain' },
    { id: 'code', label: 'Invite Code' },
  ];

  return (
    <AuthLayout 
      title="Create an account" 
      subtitle="Join your company on GearGuard"
    >
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      <form onSubmit={handleSubmit} className="space-y-5">
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
          placeholder="Enter your work email"
          icon={Mail}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
        />

        {activeTab === 'code' && (
          <Input
            label="Invite Code"
            type="text"
            placeholder="e.g., GG-ACME-9342"
            icon={Key}
            value={formData.inviteCode}
            onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
            error={errors.inviteCode}
          />
        )}

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

        <div className="relative">
          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Password requirements hint */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>Password must contain:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
              At least 8 characters
            </li>
            <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
              One uppercase letter
            </li>
            <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
              One lowercase letter
            </li>
            <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : ''}>
              One special character
            </li>
          </ul>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
          Create Account
        </Button>

        <p className="text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
