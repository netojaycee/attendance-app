"use client";

import { useState, useEffect } from "react";
import { Lock, Mail, User, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAccountDetailsAction,
  updateProfileAction,
  changePasswordAction,
  changeEmailAction,
} from "@/lib/actions/account.actions";
import { getDistrictsAction } from "@/lib/actions/district.actions";
import { VoicePart } from "@/prisma/generated/enums";

interface District {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  voicePart: VoicePart;
  instrument?: string | null;
  districtId: string;
  role: string;
  isVerified: boolean;
  isPasswordChangeRequired: boolean;
  status: string;
  createdAt: string | Date;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    voicePart: "",
    instrument: "",
    districtId: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Email form state
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    password: "",
  });
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (profileMessage) {
      const timer = setTimeout(() => setProfileMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [profileMessage]);

  useEffect(() => {
    if (passwordMessage) {
      const timer = setTimeout(() => setPasswordMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [passwordMessage]);

  useEffect(() => {
    if (emailMessage) {
      const timer = setTimeout(() => setEmailMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [emailMessage]);

  // Fetch user profile and districts
  useEffect(() => {
    const fetchProfileAndDistricts = async () => {
      try {
        // Fetch districts
        const districtsResult = await getDistrictsAction();
        if (districtsResult.success && districtsResult.data) {
          setDistricts(districtsResult.data);
        }

        // Fetch user profile
        const result = await getAccountDetailsAction();
        if (result.success && result.data) {
          setUser(result.data);
          setProfileForm({
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            voicePart: result.data.voicePart,
            instrument: result.data.instrument || "",
            districtId: result.data.districtId,
          });
          setEmailForm((prev) => ({ ...prev, newEmail: result.data.email }));
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndDistricts();
  }, []);

  // Validate profile form
  const isProfileFormValid = () => {
    if (!profileForm.firstName?.trim()) {
      setProfileError("First name is required");
      return false;
    }
    if (!profileForm.lastName?.trim()) {
      setProfileError("Last name is required");
      return false;
    }
    if (!profileForm.voicePart) {
      setProfileError("Voice part is required");
      return false;
    }
    if (!profileForm.districtId?.trim()) {
      setProfileError("District ID is required");
      return false;
    }
    return true;
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileMessage("");

    if (!isProfileFormValid()) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateProfileAction(
        profileForm.firstName || undefined,
        profileForm.lastName || undefined,
        profileForm.voicePart as VoicePart,
        profileForm.instrument || undefined,
        profileForm.districtId || undefined
      );

      if (result.success) {
        setProfileMessage(result.message || "Profile updated successfully!");
        setUser((prev) =>
          prev
            ? {
                ...prev,
                firstName: profileForm.firstName,
                lastName: profileForm.lastName,
                voicePart: profileForm.voicePart as VoicePart,
                instrument: profileForm.instrument,
                districtId: profileForm.districtId,
              }
            : null
        );
      } else {
        setProfileError(result.error || "Failed to update profile");
      }
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (!passwordForm.currentPassword?.trim()) {
      setPasswordError("Current password is required");
      return;
    }

    if (!passwordForm.newPassword?.trim()) {
      setPasswordError("New password is required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setIsSaving(true);

    try {
      const result = await changePasswordAction(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (result.success) {
        setPasswordMessage(result.message || "Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPasswordError(result.error || "Failed to change password");
      }
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle email change
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailMessage("");

    if (!emailForm.newEmail?.trim()) {
      setEmailError("Email address is required");
      return;
    }

    if (!emailForm.newEmail.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!emailForm.password?.trim()) {
      setEmailError("Password is required to change email");
      return;
    }

    setIsSaving(true);

    try {
      const result = await changeEmailAction(
        emailForm.newEmail,
        emailForm.password
      );

      if (result.success) {
        setEmailMessage(
          result.message || "Email changed successfully! Please verify your new email."
        );
        setEmailForm((prev) => ({ ...prev, password: "" }));
        if (user) {
          setUser({ ...user, email: emailForm.newEmail });
        }
      } else {
        setEmailError(result.error || "Failed to change email");
      }
    } catch (error) {
      setEmailError(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pb-24 space-y-4 p-4">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-4 p-4">
      {/* Profile Header */}
      <div className="text-center py-4">
        <div className="w-20 h-20 rounded-full bg-primary/20 dark:bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {user?.email}
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              user?.isVerified
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
            }`}
          >
            {user?.isVerified ? "Verified" : "Unverified"}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/20 text-primary dark:text-primary capitalize">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Profile Information Section */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Personal Information
          </h2>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  First Name
                </label>
                <Input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      firstName: e.target.value,
                    })
                  }
                  className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-700"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Last Name
                </label>
                <Input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      lastName: e.target.value,
                    })
                  }
                  className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-700"
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Voice Part */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Voice Part
              </label>
              <Select value={profileForm.voicePart} onValueChange={(value) =>
                setProfileForm({ ...profileForm, voicePart: value })
              }>
                <SelectTrigger className="w-full text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-700">
                  <SelectValue placeholder="Select voice part" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800">
                  <SelectItem value="SOPRANO">Soprano</SelectItem>
                  <SelectItem value="ALTO">Alto</SelectItem>
                  <SelectItem value="TENOR">Tenor</SelectItem>
                  <SelectItem value="BASS">Bass</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Instrument */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Instrument (Optional)
              </label>
              <Input
                type="text"
                value={profileForm.instrument}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    instrument: e.target.value,
                  })
                }
                className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-700"
                placeholder="e.g., Piano, Violin"
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                District
              </label>
              <Select value={profileForm.districtId} onValueChange={(value) =>
                setProfileForm({ ...profileForm, districtId: value })
              }>
                <SelectTrigger className="w-full text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-700">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800">
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Messages */}
            {profileError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {profileError}
              </div>
            )}
            {profileMessage && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                {profileMessage}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Change Email Section */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Address
          </h2>

          <form onSubmit={handleEmailChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                New Email Address
              </label>
              <Input
                type="email"
                value={emailForm.newEmail}
                onChange={(e) =>
                  setEmailForm({
                    ...emailForm,
                    newEmail: e.target.value,
                  })
                }
                className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-700"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showEmailPassword ? "text" : "password"}
                  value={emailForm.password}
                  onChange={(e) =>
                    setEmailForm({
                      ...emailForm,
                      password: e.target.value,
                    })
                  }
                  className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-700 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowEmailPassword(!showEmailPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showEmailPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Messages */}
            {emailError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {emailError}
              </div>
            )}
            {emailMessage && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                {emailMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSaving}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Update Email
                </>
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Change Password Section */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Password & Security
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-700 pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      current: !showPasswords.current,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-700 pr-10"
                  placeholder="Enter new password (min 8 characters)"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      new: !showPasswords.new,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-700 pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      confirm: !showPasswords.confirm,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Messages */}
            {passwordError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {passwordError}
              </div>
            )}
            {passwordMessage && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                {passwordMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Change Password
                </>
              )}
            </Button>
          </form>

          {/* Password Requirements */}
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Password requirements:
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <li>✓ Minimum 8 characters</li>
              <li>✓ Mix of uppercase and lowercase letters</li>
              <li>✓ At least one number</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Account Status Section */}
      {user && (
        <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="p-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              Account Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Account Status:
                </span>
                <span className="font-semibold capitalize text-slate-900 dark:text-white">
                  {user.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Role:</span>
                <span className="font-semibold capitalize text-slate-900 dark:text-white">
                  {user.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Member Since:
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
