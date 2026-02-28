'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Lock, 
  Shield, 
  Save, 
  Eye, 
  EyeOff, 
  CreditCard, 
  MessageSquare, 
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Settings,
  RefreshCw,
  Key,
  Link2
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, updateProfile, changePassword, setupTwoFactor, disableTwoFactor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Gateway credentials visibility state
  const [showGatewayCredentials, setShowGatewayCredentials] = useState({
    payhereUsername: false,
    payherePassword: false,
    payhereMerchantId: false,
    payhereSecret: false,
    sendlkUsername: false,
    sendlkPassword: false,
    sendlkApiKey: false,
    sendlkSenderId: false
  });

  // Gateway credentials state loaded from environment variables
  const [gatewayCredentials, setGatewayCredentials] = useState({
    payhere: {
      username: process.env.NEXT_PUBLIC_PAYHERE_USERNAME || '',
      password: process.env.NEXT_PUBLIC_PAYHERE_PASSWORD || '',
      merchantId: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '',
      merchantSecret: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_SECRET || '',
      dashboardUrl: process.env.NEXT_PUBLIC_PAYHERE_DASHBOARD_URL || 'https://www.payhere.lk/account/dashboard',
      lastSync: '2024-01-15 10:30 AM',
      status: 'active'
    },
    sendlk: {
      username: process.env.NEXT_PUBLIC_SENDLK_USERNAME || '',
      password: process.env.NEXT_PUBLIC_SENDLK_PASSWORD || '',
      apiKey: process.env.NEXT_PUBLIC_SENDLK_API_KEY || '',
      senderId: process.env.NEXT_PUBLIC_SENDLK_SENDER_ID || '',
      dashboardUrl: 'https://sms.send.lk/dashboard',
      lastSync: '2024-01-15 11:45 AM',
      status: 'active'
    }
  });

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Two-factor form state
  const [twoFactorData, setTwoFactorData] = useState({
    pin: '',
    confirmPin: ''
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (result.success) {
        toast.success('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (twoFactorData.pin !== twoFactorData.confirmPin) {
      toast.error('PINs do not match');
      setLoading(false);
      return;
    }

    if (!/^[0-9]{6}$/.test(twoFactorData.pin)) {
      toast.error('PIN must be exactly 6 digits');
      setLoading(false);
      return;
    }

    try {
      const result = await setupTwoFactor(twoFactorData.pin);
      if (result.success) {
        toast.success('Two-factor authentication enabled successfully');
        setTwoFactorData({ pin: '', confirmPin: '' });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to setup two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorDisable = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) return;

    setLoading(true);
    try {
      const result = await disableTwoFactor();
      if (result.success) {
        toast.success('Two-factor authentication disabled');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to disable two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) {
      toast.error(`No ${label} available to copy`);
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const testConnection = (gateway: string) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success(`${gateway} connection test successful`);
      setLoading(false);
    }, 1500);
  };

  const syncGateway = (gateway: string) => {
    setLoading(true);
    // Simulate sync
    setTimeout(() => {
      const now = new Date().toLocaleString('en-US', { 
        dateStyle: 'short', 
        timeStyle: 'short' 
      });
      setGatewayCredentials(prev => ({
        ...prev,
        [gateway === 'PayHere' ? 'payhere' : 'sendlk']: {
          ...prev[gateway === 'PayHere' ? 'payhere' : 'sendlk'],
          lastSync: now
        }
      }));
      toast.success(`${gateway} synchronized successfully`);
      setLoading(false);
    }, 1500);
  };

  // Check if credentials are loaded
  const areCredentialsLoaded = (gateway: 'payhere' | 'sendlk') => {
    const creds = gatewayCredentials[gateway];
    if (gateway === 'payhere') {
      return !!(creds.username && creds.password);
    }
    return !!(creds.username && creds.password);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="two-factor" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">2FA</span>
            </TabsTrigger>
            <TabsTrigger value="gateways" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Gateways</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={user?.role?.replace('_', ' ').toUpperCase() || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500">Role cannot be changed</p>
                  </div>

                  <Button type="submit" disabled={loading} className="bg-primary">
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="bg-primary">
                    <Lock className="w-4 h-4 mr-2" />
                    {loading ? 'Changing...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Two-Factor Tab */}
          <TabsContent value="two-factor">
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                {user?.twoFactorEnabled ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-200 border border-green-500 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-black" />
                        <span className="font-medium text-black">Two-factor authentication is enabled</span>
                      </div>
                      <p className="text-sm text-black mt-1">
                        Your account is protected with an additional security layer.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Button
                        onClick={handleTwoFactorDisable}
                        disabled={loading}
                        className='bg-red-500'
                        variant="destructive"
                      >
                        {loading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleTwoFactorSetup} className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Two-factor authentication is disabled</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Enable two-factor authentication to add an extra layer of security to your account.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pin">Create 6-Digit PIN</Label>
                      <Input
                        id="pin"
                        type="password"
                        maxLength={6}
                        value={twoFactorData.pin}
                        onChange={(e) => setTwoFactorData({...twoFactorData, pin: e.target.value.replace(/\D/g, '')})}
                        placeholder="000000"
                        className="text-center text-lg tracking-widest"
                      />
                      <p className="text-sm text-gray-500">
                        This PIN will be required when logging in to your account.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPin">Confirm PIN</Label>
                      <Input
                        id="confirmPin"
                        type="password"
                        maxLength={6}
                        value={twoFactorData.confirmPin}
                        onChange={(e) => setTwoFactorData({...twoFactorData, confirmPin: e.target.value.replace(/\D/g, '')})}
                        placeholder="000000"
                        className="text-center text-lg tracking-widest"
                      />
                    </div>

                    <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                      <Shield className="w-4 h-4 mr-2" />
                      {loading ? 'Enabling...' : 'Enable Two-Factor Authentication'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gateways Tab */}
          <TabsContent value="gateways">
            <div className="space-y-6">
              {/* Gateway Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Active Gateways</p>
                    <p className="text-2xl font-bold text-gray-800">2</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Credentials Status</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {areCredentialsLoaded('payhere') && areCredentialsLoaded('sendlk') ? 'Loaded' : 'Partial'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <RefreshCw className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Last Synced</p>
                    <p className="text-lg font-semibold text-gray-800">5 min ago</p>
                  </div>
                </div>
              </div>

              {/* PayHere Gateway Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>PayHere Payment Gateway</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">Process online payments securely</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        areCredentialsLoaded('payhere')
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {areCredentialsLoaded('payhere') ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Credentials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Merchant ID</Label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Input
                            type={showGatewayCredentials.payhereMerchantId ? 'text' : 'password'}
                            value={gatewayCredentials.payhere.merchantId || 'Not configured'}
                            disabled
                            className="bg-gray-50 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGatewayCredentials({
                              ...showGatewayCredentials,
                              payhereMerchantId: !showGatewayCredentials.payhereMerchantId
                            })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showGatewayCredentials.payhereMerchantId ? 
                              <EyeOff className="w-4 h-4" /> : 
                              <Eye className="w-4 h-4" />
                            }
                          </button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(gatewayCredentials.payhere.merchantId, 'Merchant ID')}
                          disabled={!gatewayCredentials.payhere.merchantId}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Merchant Secret</Label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Input
                            type={showGatewayCredentials.payhereSecret ? 'text' : 'password'}
                            value={gatewayCredentials.payhere.merchantSecret || 'Not configured'}
                            disabled
                            className="bg-gray-50 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGatewayCredentials({
                              ...showGatewayCredentials,
                              payhereSecret: !showGatewayCredentials.payhereSecret
                            })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showGatewayCredentials.payhereSecret ? 
                              <EyeOff className="w-4 h-4" /> : 
                              <Eye className="w-4 h-4" />
                            }
                          </button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(gatewayCredentials.payhere.merchantSecret, 'Merchant Secret')}
                          disabled={!gatewayCredentials.payhere.merchantSecret}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Input
                            type={showGatewayCredentials.payhereUsername ? 'text' : 'password'}
                            value={gatewayCredentials.payhere.username || 'Not configured'}
                            disabled
                            className="bg-gray-50 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGatewayCredentials({
                              ...showGatewayCredentials,
                              payhereUsername: !showGatewayCredentials.payhereUsername
                            })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showGatewayCredentials.payhereUsername ? 
                              <EyeOff className="w-4 h-4" /> : 
                              <Eye className="w-4 h-4" />
                            }
                          </button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(gatewayCredentials.payhere.username, 'Username')}
                          disabled={!gatewayCredentials.payhere.username}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Input
                            type={showGatewayCredentials.payherePassword ? 'text' : 'password'}
                            value={gatewayCredentials.payhere.password || 'Not configured'}
                            disabled
                            className="bg-gray-50 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGatewayCredentials({
                              ...showGatewayCredentials,
                              payherePassword: !showGatewayCredentials.payherePassword
                            })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showGatewayCredentials.payherePassword ? 
                              <EyeOff className="w-4 h-4" /> : 
                              <Eye className="w-4 h-4" />
                            }
                          </button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(gatewayCredentials.payhere.password, 'Password')}
                          disabled={!gatewayCredentials.payhere.password}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Last Sync */}
                  <div className="space-y-2">
                    <Label>Last Sync</Label>
                    <Input value={gatewayCredentials.payhere.lastSync} disabled className="bg-gray-50" />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => window.open(gatewayCredentials.payhere.dashboardUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => testConnection('PayHere')}
                      disabled={loading || !areCredentialsLoaded('payhere')}
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => syncGateway('PayHere')}
                      disabled={loading || !areCredentialsLoaded('payhere')}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Sync Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Send.lk Gateway Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Send.lk SMS Gateway</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">Send SMS notifications to customers</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        areCredentialsLoaded('sendlk')
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {areCredentialsLoaded('sendlk') ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Account Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Input
                            type={showGatewayCredentials.sendlkUsername ? 'text' : 'password'}
                            value={gatewayCredentials.sendlk.username || 'Not configured'}
                            disabled
                            className="bg-gray-50 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGatewayCredentials({
                              ...showGatewayCredentials,
                              sendlkUsername: !showGatewayCredentials.sendlkUsername
                            })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showGatewayCredentials.sendlkUsername ? 
                              <EyeOff className="w-4 h-4" /> : 
                              <Eye className="w-4 h-4" />
                            }
                          </button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(gatewayCredentials.sendlk.username, 'Username')}
                          disabled={!gatewayCredentials.sendlk.username}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Input
                            type={showGatewayCredentials.sendlkPassword ? 'text' : 'password'}
                            value={gatewayCredentials.sendlk.password || 'Not configured'}
                            disabled
                            className="bg-gray-50 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGatewayCredentials({
                              ...showGatewayCredentials,
                              sendlkPassword: !showGatewayCredentials.sendlkPassword
                            })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showGatewayCredentials.sendlkPassword ? 
                              <EyeOff className="w-4 h-4" /> : 
                              <Eye className="w-4 h-4" />
                            }
                          </button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(gatewayCredentials.sendlk.password, 'Password')}
                          disabled={!gatewayCredentials.sendlk.password}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* API Key and Sender ID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Input
                            type={showGatewayCredentials.sendlkApiKey ? 'text' : 'password'}
                            value={gatewayCredentials.sendlk.apiKey || 'Not configured'}
                            disabled
                            className="bg-gray-50 pr-10 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGatewayCredentials({
                              ...showGatewayCredentials,
                              sendlkApiKey: !showGatewayCredentials.sendlkApiKey
                            })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showGatewayCredentials.sendlkApiKey ? 
                              <EyeOff className="w-4 h-4" /> : 
                              <Eye className="w-4 h-4" />
                            }
                          </button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(gatewayCredentials.sendlk.apiKey, 'API Key')}
                          disabled={!gatewayCredentials.sendlk.apiKey}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Sender ID</Label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Input
                            type={showGatewayCredentials.sendlkSenderId ? 'text' : 'password'}
                            value={gatewayCredentials.sendlk.senderId || 'Not configured'}
                            disabled
                            className="bg-gray-50 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGatewayCredentials({
                              ...showGatewayCredentials,
                              sendlkSenderId: !showGatewayCredentials.sendlkSenderId
                            })}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showGatewayCredentials.sendlkSenderId ? 
                              <EyeOff className="w-4 h-4" /> : 
                              <Eye className="w-4 h-4" />
                            }
                          </button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(gatewayCredentials.sendlk.senderId, 'Sender ID')}
                          disabled={!gatewayCredentials.sendlk.senderId}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Last Sync */}
                  <div className="space-y-2">
                    <Label>Last Sync</Label>
                    <Input value={gatewayCredentials.sendlk.lastSync} disabled className="bg-gray-50" />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => window.open(gatewayCredentials.sendlk.dashboardUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => testConnection('Send.lk')}
                      disabled={loading || !areCredentialsLoaded('sendlk')}
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => syncGateway('Send.lk')}
                      disabled={loading || !areCredentialsLoaded('sendlk')}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Sync Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Tips */}
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-800">
                    <Key className="w-5 h-5" />
                    <span>Security Guidelines</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-yellow-700">
                    <li className="flex items-start space-x-2">
                      <span className="font-medium">•</span>
                      <span>Gateway credentials are loaded from secure environment variables</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-medium">•</span>
                      <span>Never share your gateway credentials with unauthorized personnel</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-medium">•</span>
                      <span>Regularly update your gateway passwords and API keys</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-medium">•</span>
                      <span>Monitor gateway activity through their respective dashboards</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-medium">•</span>
                      <span>Enable two-factor authentication on gateway accounts when available</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}