import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Briefcase, Building2, Calendar, Edit2, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string | null;
  department: string | null;
  bio: string | null;
  avatar: string | null;
  created_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`http://localhost:8000/profile.php?id=${user.id}`, {
        headers: {
          'Authorization': localStorage.getItem('token') || '',
        },
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.user);
        setEditedProfile(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedProfile) return;

    // Validation
    if (!editedProfile.name || editedProfile.name.trim().length < 2) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name must be at least 2 characters long.",
      });
      return;
    }

    if (editedProfile.phone && !/^\d{10}$/.test(editedProfile.phone.replace(/\s/g, ''))) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Phone number must be exactly 10 digits.",
      });
      return;
    }

    if (editedProfile.department && editedProfile.department.trim().length < 2) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Department must be at least 2 characters long.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:8000/update_profile.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          id: editedProfile.id,
          name: editedProfile.name,
          phone: editedProfile.phone,
          bio: editedProfile.bio,
          department: editedProfile.department,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.user);
        setEditedProfile(data.user);
        setIsEditing(false);
        
        // Update localStorage with new user data
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          name: data.user.name,
        }));

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: data.message || 'Failed to update profile',
        });
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <AppLayout title="Profile" subtitle="Manage your account information">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-pulse text-muted-foreground">Loading profile...</div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout title="Profile" subtitle="Manage your account information">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-muted-foreground">Failed to load profile</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile" subtitle="Manage your account information">
      <div className="space-y-6">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-soft-lg overflow-hidden"
        >
          {/* Cover Background */}
          <div className="h-32 bg-gradient-to-br from-primary via-accent to-primary/80 relative">
            <button
              onClick={() => navigate('/dashboard')}
              className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
          </div>

          {/* Profile Content */}
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16 relative z-10">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center border-4 border-card shadow-xl">
                  <span className="text-primary-foreground font-bold text-4xl">
                    {getInitials(profile.name)}
                  </span>
                </div>
              </div>

              {/* Name and Role */}
              <div className="flex-1 pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile?.name || ''}
                        onChange={(e) => setEditedProfile(prev => prev ? {...prev, name: e.target.value.slice(0, 100)} : null)}
                        maxLength={100}
                        className="text-3xl font-bold text-foreground mb-1 bg-muted/50 border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all w-full max-w-md"
                        placeholder="Enter your name"
                        required
                      />
                    ) : (
                      <h1 className="text-3xl font-bold text-foreground mb-1">
                        {profile.name}
                      </h1>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-accent/15 text-accent border border-accent/30">
                        {profile.role || 'User'}
                      </span>
                      {profile.department && (
                        <span className="text-muted-foreground text-sm">
                          {profile.department}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit Button */}
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border shadow-soft-lg p-8"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <div className="px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground">
                {profile.email}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedProfile?.phone || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setEditedProfile(prev => prev ? {...prev, phone: value} : null);
                  }}
                  maxLength={10}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  placeholder="Enter 10-digit phone number"
                />
              ) : (
                <div className="px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground">
                  {profile.phone || 'Not provided'}
                </div>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Role
              </label>
              <div className="px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground">
                {profile.role || 'Not assigned'}
              </div>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Department
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile?.department || ''}
                  onChange={(e) => setEditedProfile(prev => prev ? {...prev, department: e.target.value.slice(0, 100)} : null)}
                  maxLength={100}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  placeholder="Enter department"
                />
              ) : (
                <div className="px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground">
                  {profile.department || 'Not assigned'}
                </div>
              )}
            </div>

            {/* Member Since */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member Since
              </label>
              <div className="px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={editedProfile?.bio || ''}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, bio: e.target.value.slice(0, 500)} : null)}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none"
                placeholder="Tell us about yourself... (max 500 characters)"
              />
            ) : (
              <div className="px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground min-h-[100px]">
                {profile.bio || 'No bio added yet.'}
              </div>
            )}
          </div>
        </motion.div>

        {/* Activity Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border shadow-soft-lg p-8"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">Activity Overview</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/30 rounded-xl">
              <div className="text-3xl font-bold text-primary mb-1">24</div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-xl">
              <div className="text-3xl font-bold text-accent mb-1">12</div>
              <div className="text-sm text-muted-foreground">Pending Approvals</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-xl">
              <div className="text-3xl font-bold text-foreground mb-1">8</div>
              <div className="text-sm text-muted-foreground">Resources Booked</div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
