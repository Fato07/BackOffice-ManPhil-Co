import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Shield, Clock, BarChart } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image 
                src="/Logo Manphil&Co.svg"
                alt="ManPhil&Co Logo"
                width={150}
                height={84}
                className="h-10 w-auto"
                priority
              />
            </div>
            
            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="outline">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="bg-[#B5985A] hover:bg-[#B5985A]/90">
                    Get Started
                  </Button>
                </SignUpButton>
              </SignedOut>
              
              <SignedIn>
                <Link href="/houses">
                  <Button className="bg-[#B5985A] hover:bg-[#B5985A]/90">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Luxury Property Management
            <span className="block text-[#B5985A] mt-2">Made Simple</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your vacation rental business with our comprehensive back-office system. 
            Manage properties, bookings, and operations all in one place.
          </p>
          
          <div className="flex gap-4 justify-center">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-[#B5985A] hover:bg-[#B5985A]/90">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignUpButton>
            </SignedOut>
            
            <SignedIn>
              <Link href="/houses">
                <Button size="lg" className="bg-[#B5985A] hover:bg-[#B5985A]/90">
                  Access Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Manage Luxury Rentals
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={Home}
              title="Property Management"
              description="Organize and track all your luxury properties in one centralized system."
            />
            <FeatureCard
              icon={BarChart}
              title="Analytics & Reporting"
              description="Get insights into occupancy rates, revenue, and performance metrics."
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Reliable"
              description="Bank-grade security with automatic backups and 99.9% uptime guarantee."
            />
            <FeatureCard
              icon={Clock}
              title="24/7 Availability"
              description="Access your data anytime, anywhere with our cloud-based platform."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#B5985A]/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Property Management?
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Join ManPhil&Co and experience the future of luxury vacation rental management.
          </p>
          
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" className="bg-[#B5985A] hover:bg-[#B5985A]/90">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} ManPhil&Co. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: any; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-[#B5985A]/10 rounded-lg mb-4">
        <Icon className="h-8 w-8 text-[#B5985A]" />
      </div>
      <h4 className="text-xl font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}