import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthLayout } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await login(formData.email, formData.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Sign in to your account to continue"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
            placeholder="Enter your password"
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
          Sign In
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">or</span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </p>
          <p className="text-gray-600">
            Register your company?{' '}
            <Link to="/register/company" className="text-blue-600 hover:text-blue-700 font-medium">
              Get started
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
