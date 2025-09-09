import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ManPhil&Co</h1>
        <p className="text-lg text-gray-600">Property Management System</p>
      </div>
      
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl border-0",
            headerTitle: "text-2xl font-semibold",
            headerSubtitle: "text-gray-600",
            socialButtonsBlockButton: "border-gray-300 hover:bg-gray-50",
            formButtonPrimary: "bg-[#B5985A] hover:bg-[#B5985A]/90 text-white",
            footerActionLink: "text-[#B5985A] hover:text-[#B5985A]/80",
            identityPreviewEditButtonIcon: "text-[#B5985A]",
            formFieldInput: "border-gray-300 focus:border-[#B5985A] focus:ring-[#B5985A]",
            formFieldInputShowPasswordButton: "text-gray-500 hover:text-[#B5985A]",
            otpCodeFieldInput: "border-gray-300 focus:border-[#B5985A] focus:ring-[#B5985A]",
            phoneInputBox: "border-gray-300 focus-within:border-[#B5985A] focus-within:ring-[#B5985A]",
          },
          layout: {
            socialButtonsPlacement: "bottom",
            showOptionalFields: true,
          },
        }}
        redirectUrl="/houses"
        signUpUrl="/sign-up"
      />

      <p className="mt-8 text-sm text-gray-500 text-center">
        &copy; {new Date().getFullYear()} ManPhil&Co. All rights reserved.
      </p>
    </div>
  );
}