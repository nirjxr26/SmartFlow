import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Eye, EyeOff, Save, Moon, Sun, Check, Lock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

interface UserSettings {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  bio: string;
  avatar: string | null;
}

interface Preferences {
  emailNotifications: boolean;
  taskReminders: boolean;
  approvalRequests: boolean;
  systemUpdates: boolean;
  theme: string;
}

export default function Settings() {
  const [isDark, setIsDark] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profile, setProfile] = useState<UserSettings | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`http://localhost:8000/backend/settings.php?userId=${user.id}`, {
        headers: {
          'Authorization': localStorage.getItem('token') || '',
        },
      });
      const data = await response.json();

      if (data.success) {
        setProfile(data.user);
        setPreferences(data.preferences);
        
        // Sync isDark state with current theme (don't change the theme itself)
        const currentTheme = data.preferences.theme || 'light';
        setIsDark(currentTheme === 'dark');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:8000/backend/settings.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          action: 'updateProfile',
          id: profile.id,
          name: profile.name,
          email: profile.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          name: data.user.name,
          email: data.user.email,
        }));

        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Profile updated successfully',
          confirmButtonColor: '#3b82f6',
          timer: 1500,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to update profile',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update profile',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in all password fields',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'New passwords do not match',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    if (passwords.newPassword.length < 8) {
      Swal.fire({
        icon: 'error',
        title: 'Weak Password',
        text: 'Password must be at least 8 characters',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch('http://localhost:8000/backend/settings.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          action: 'updatePassword',
          id: user.id,
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Password updated successfully',
          confirmButtonColor: '#3b82f6',
          timer: 1500,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to update password',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update password',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Image must be less than 5MB',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please upload an image file',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    formData.append('userId', user.id.toString());

    try {
      const response = await fetch('http://localhost:8000/backend/upload_avatar.php', {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('token') || '',
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setProfile(prev => prev ? { ...prev, avatar: data.avatar } : null);
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Avatar updated successfully',
          confirmButtonColor: '#3b82f6',
          timer: 1500,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to upload avatar',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to upload avatar',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreference = async (key: keyof Preferences) => {
    if (!preferences) return;

    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await fetch('http://localhost:8000/backend/settings.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          action: 'updatePreferences',
          id: user.id,
          preferences: newPreferences,
        }),
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
    
    // Save theme to database
    if (preferences) {
      const newPreferences = { ...preferences, theme: newTheme };
      setPreferences(newPreferences);
      
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        await fetch('http://localhost:8000/backend/settings.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') || '',
          },
          body: JSON.stringify({
            action: 'updatePreferences',
            id: user.id,
            preferences: newPreferences,
          }),
        });
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading || !profile || !preferences) {
    return (
      <AppLayout title="Settings" subtitle="Manage your account preferences and profile.">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings" subtitle="Manage your account preferences and profile.">
      <div className="space-y-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-6">Profile Information</h2>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {/* Avatar */}
            <div className="relative group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center overflow-hidden">
                {profile.avatar ? (
                  <img 
                    src={`http://localhost:8000${profile.avatar}`} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary-foreground text-2xl font-bold">
                    {getInitials(profile.name)}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-foreground/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-6 h-6 text-background" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profile.role || 'N/A'}
                    disabled
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Department
                  </label>
                  <input
                    type="text"
                    value={profile.department || 'N/A'}
                    disabled
                    className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-xl text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="btn-primary-gradient flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </motion.div>

        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-6">Appearance</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground mb-1">Theme</h3>
              <p className="text-sm text-muted-foreground">
                Choose between light and dark mode
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (isDark) toggleTheme();
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  !isDark
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                onClick={() => {
                  if (!isDark) toggleTheme();
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  isDark
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
            </div>
          </div>
        </motion.div>

        {/* Password Change */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-6">Change Password</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-12 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-12 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Password Requirements */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">Password Requirements</h4>
              <ul className="space-y-1.5">
                {[
                  "At least 8 characters",
                  "One uppercase letter",
                  "One lowercase letter",
                  "One number",
                  "One special character",
                ].map((req, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="w-3.5 h-3.5 text-muted-foreground" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpdatePassword}
              disabled={isSaving}
              className="btn-accent-gradient flex items-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {isSaving ? 'Updating...' : 'Update Password'}
            </motion.button>
          </div>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-6">Notification Preferences</h2>
          
          <div className="space-y-4">
            {preferences && Object.entries({
              emailNotifications: { label: "Email notifications", description: "Receive email updates for important activities" },
              taskReminders: { label: "Task reminders", description: "Get notified before task deadlines" },
              approvalRequests: { label: "Approval requests", description: "Notifications for pending approvals" },
              systemUpdates: { label: "System updates", description: "Stay informed about system changes" },
            }).map(([key, pref]) => (
              <div
                key={key}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div>
                  <h3 className="font-medium text-foreground">{pref.label}</h3>
                  <p className="text-sm text-muted-foreground">{pref.description}</p>
                </div>
                <button
                  onClick={() => togglePreference(key as keyof Preferences)}
                  className={cn(
                    "w-12 h-7 rounded-full transition-colors relative",
                    preferences[key as keyof Preferences] ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-5 h-5 rounded-full bg-background shadow-sm transition-all",
                      preferences[key as keyof Preferences] ? "left-6" : "left-1"
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}