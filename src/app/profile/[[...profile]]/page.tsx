"use client";

import { UserProfile } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <UserProfile 
            path="/profile"
            routing="path"
            appearance={{
              baseTheme: undefined,
              variables: {
                colorPrimary: "#B5985A",
                colorText: "#0A0A0A",
                colorTextSecondary: "#6B7280",
                colorBackground: "#FFFFFF",
                colorInputBackground: "#FAFAF8",
                colorInputText: "#0A0A0A",
                borderRadius: "0.5rem",
                fontFamily: "var(--font-inter), system-ui, sans-serif",
              },
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0",
                navbar: "border-b border-gray-200 mb-6",
                navbarButton: "text-gray-600 hover:text-[#B5985A] data-[active=true]:text-[#B5985A] data-[active=true]:border-[#B5985A]",
                navbarButtonContainer: "space-x-8",
                pageScrollBox: "p-0",
                formButtonPrimary: "bg-[#B5985A] hover:bg-[#B5985A]/90 text-white transition-all duration-300",
                formFieldInput: "border-gray-300 focus:border-[#B5985A] focus:ring-2 focus:ring-[#B5985A]/20 rounded-lg",
                headerTitle: "text-2xl font-serif",
                headerSubtitle: "text-gray-600",
                badge: "bg-[#B5985A]/10 text-[#B5985A] border-[#B5985A]/20",
                avatarBox: "rounded-full border-2 border-[#B5985A]/20",
                profileSectionTitle: "text-lg font-semibold text-gray-900 mb-4",
                profileSectionContent: "space-y-4",
                accordionTriggerButton: "hover:bg-gray-50 rounded-lg transition-colors",
                formFieldLabel: "text-sm font-medium text-gray-700",
                formFieldAction: "text-[#B5985A] hover:text-[#B5985A]/80",
                formFieldHintText: "text-gray-500 text-sm",
                formFieldSuccessText: "text-emerald-600 text-sm",
                formFieldErrorText: "text-rose-600 text-sm",
                formButtonReset: "text-gray-600 hover:text-gray-800 hover:bg-gray-100",
                formButtonCancel: "text-gray-600 hover:text-gray-800 hover:bg-gray-100",
                actionCard: "border-gray-200 hover:border-[#B5985A]/40 transition-all duration-300",
                fileDropAreaBox: "border-2 border-dashed border-gray-300 hover:border-[#B5985A] hover:bg-[#B5985A]/5 transition-all duration-300 rounded-lg",
                fileDropAreaIconBox: "text-gray-400",
                fileDropAreaHint: "text-gray-500",
                fileDropAreaButtonPrimary: "text-[#B5985A] hover:text-[#B5985A]/80 font-medium",
              },
              layout: {
                socialButtonsPlacement: "bottom",
                socialButtonsVariant: "iconButton",
              }
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}