import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Shield, Clock, BarChart, Star, MapPin, Calendar, Users } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      </div>

      <nav className="relative z-50 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Image 
                src="/Logo Manphil&Co.svg"
                alt="ManPhil&Co Logo"
                width={180}
                height={100}
                className="h-12 w-auto brightness-0 invert"
                priority
              />
            </div>
            
            <div className="flex items-center gap-6">
              <SignedOut>
                <Link href="/sign-in">
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-[#B5985A] transition-colors"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-[#B5985A] hover:bg-[#B5985A]/90 text-white border border-[#B5985A] shadow-lg shadow-[#B5985A]/20 transition-all hover:shadow-[#B5985A]/40">
                    Get Started
                  </Button>
                </Link>
              </SignedOut>
              
              <SignedIn>
                <Link href="/houses">
                  <Button className="bg-[#B5985A] hover:bg-[#B5985A]/90 text-white border border-[#B5985A] shadow-lg shadow-[#B5985A]/20 transition-all hover:shadow-[#B5985A]/40">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-7xl md:text-8xl font-serif font-light mb-6 leading-tight">
              Luxury Property
              <span className="block text-gradient mt-2">Management</span>
              <span className="block text-3xl md:text-4xl mt-6 font-sans font-normal text-gray-400">
                Elevated to Perfection
              </span>
            </h1>
          </div>
          
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto animate-slide-up opacity-0 [animation-delay:200ms]">
            Experience the pinnacle of vacation rental management. Our sophisticated platform 
            transforms how you orchestrate luxury properties, delivering excellence at every touchpoint.
          </p>
          
          <div className="flex gap-6 justify-center animate-slide-up opacity-0 [animation-delay:400ms]">
            <SignedOut>
              <Link href="/sign-up">
                <Button size="lg" className="bg-[#B5985A] hover:bg-[#B5985A]/90 text-white px-8 py-6 text-lg border border-[#B5985A] shadow-lg shadow-[#B5985A]/20 transition-all hover:shadow-[#B5985A]/40 hover:scale-105">
                  Begin Your Journey
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg backdrop-blur-sm"
              >
                View Demo
              </Button>
            </SignedOut>
            
            <SignedIn>
              <Link href="/houses">
                <Button size="lg" className="bg-[#B5985A] hover:bg-[#B5985A]/90 text-white px-8 py-6 text-lg border border-[#B5985A] shadow-lg shadow-[#B5985A]/20 transition-all hover:shadow-[#B5985A]/40 hover:scale-105">
                  Access Dashboard
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>

        <div className="absolute top-20 left-10 w-20 h-20 bg-[#B5985A]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-[#1c355e]/30 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
      </section>

      <section className="py-20 border-y border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StatCard number="500+" label="Luxury Properties" />
            <StatCard number="98%" label="Client Satisfaction" />
            <StatCard number="24/7" label="Premium Support" />
            <StatCard number="€2M+" label="Revenue Managed" />
          </div>
        </div>
      </section>

      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-serif font-light mb-6">
              Unparalleled <span className="text-gradient">Features</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Every detail crafted for the discerning property manager
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <LuxuryFeatureCard
              icon={Home}
              title="Portfolio Excellence"
              description="Curate and showcase your premium property collection with sophisticated management tools."
            />
            <LuxuryFeatureCard
              icon={Calendar}
              title="Seamless Orchestration"
              description="Intelligent booking management that anticipates your needs and exceeds expectations."
            />
            <LuxuryFeatureCard
              icon={BarChart}
              title="Insightful Analytics"
              description="Transformative data visualization revealing opportunities for growth and optimization."
            />
            <LuxuryFeatureCard
              icon={Shield}
              title="Fortress Security"
              description="Military-grade encryption and compliance ensuring absolute peace of mind."
            />
          </div>
        </div>
      </section>

      <section className="py-32 bg-gradient-to-b from-transparent via-[#1c355e]/10 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-[#B5985A] text-[#B5985A]" />
              ))}
            </div>
            <blockquote className="text-2xl md:text-3xl font-serif font-light mb-8 leading-relaxed">
              "ManPhil&Co has revolutionized how we manage our luxury portfolio. 
              The attention to detail and sophisticated functionality is unmatched."
            </blockquote>
            <cite className="text-gray-400 not-italic">
              — Isabella Moreau, Director of Operations, Château Collection
            </cite>
          </div>
        </div>
      </section>

      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-5xl md:text-6xl font-serif font-light mb-6">
            Ready to Elevate Your
            <span className="block text-gradient">Property Management?</span>
          </h3>
          <p className="text-xl text-gray-400 mb-12">
            Join the elite circle of property managers who demand excellence.
          </p>
          
          <SignedOut>
            <Link href="/sign-up">
              <Button size="lg" className="bg-[#B5985A] hover:bg-[#B5985A]/90 text-white px-10 py-6 text-lg border border-[#B5985A] shadow-lg shadow-[#B5985A]/20 transition-all hover:shadow-[#B5985A]/40 hover:scale-105">
                Start Your Premium Experience
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </SignedOut>
        </div>
      </section>

      <footer className="border-t border-white/10 backdrop-blur-sm bg-black/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <Image 
                src="/Logo Manphil&Co.svg"
                alt="ManPhil&Co Logo"
                width={150}
                height={84}
                className="h-10 w-auto brightness-0 invert mb-4"
              />
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} ManPhil&Co. All rights reserved.
              </p>
            </div>
            <div className="flex gap-8 text-sm">
              <Link href="#" className="text-gray-400 hover:text-[#B5985A] transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-400 hover:text-[#B5985A] transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-gray-400 hover:text-[#B5985A] transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-8 glass-dark rounded-2xl border border-white/10 hover:border-[#B5985A]/50 transition-all">
      <div className="text-4xl font-serif text-gradient mb-2">{number}</div>
      <div className="text-gray-400">{label}</div>
    </div>
  );
}

function LuxuryFeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: any; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-8 glass-dark rounded-2xl border border-white/10 hover:border-[#B5985A]/50 transition-all hover:scale-105 hover:bg-white/5 group">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-[#B5985A]/10 rounded-2xl mb-6 group-hover:bg-[#B5985A]/20 transition-colors">
        <Icon className="h-8 w-8 text-[#B5985A]" />
      </div>
      <h4 className="text-xl font-serif mb-3">{title}</h4>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}