import { Link } from 'react-router-dom';
import { Cog } from 'lucide-react';

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Cog className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl text-white">GearGuard</span>
        </Link>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            The Ultimate Maintenance Tracker
          </h1>
          <p className="text-blue-100 text-lg">
            Track your assets, manage maintenance requests, and keep your equipment running smoothly.
          </p>
          <div className="flex gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-blue-200 text-sm">Companies</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-3xl font-bold text-white">10K+</p>
              <p className="text-blue-200 text-sm">Equipment</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-3xl font-bold text-white">50K+</p>
              <p className="text-blue-200 text-sm">Requests</p>
            </div>
          </div>
        </div>

        <p className="text-blue-200 text-sm">
          © 2024 GearGuard. All rights reserved.
        </p>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Cog className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-gray-900">GearGuard</span>
            </Link>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
