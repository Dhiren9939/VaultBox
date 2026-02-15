import React from "react";
import {
  Shield,
  Users,
  Github,
  UserPlus,
  MessageSquare,
  Key,
  ArrowRight,
} from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter">VaultBox</div>
        <div className="space-x-4">
          <button className="px-4 py-2 hover:text-gray-300 transition-colors cursor-pointer">
            Log In
          </button>
          <button className="px-4 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors cursor-pointer">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center gap-8">
        <div className="max-w-4xl space-y-8 flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            A password manager that can&apos;t lock you out.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl mx-auto">
            Most secure managers lose your data if you forget your master
            password. VaultBox lets you get back in using a secure backup system
            with people you trust.
          </p>
          <div className="flex gap-4 pt-4">
            <button className="px-8 py-4 bg-white text-black text-lg font-semibold rounded hover:bg-gray-200 transition-all flex items-center gap-2 cursor-pointer group">
              Start Securely{" "}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Core Promises */}
      <section className="container mx-auto px-6 py-24 border-t border-gray-900">
        <h2 className="text-3xl font-bold mb-16 text-center">
          Three Core Promises
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              icon: <Shield className="w-10 h-10 mb-4" />,
              title: "Total Privacy",
              desc: "Your passwords are scrambled on your device before they ever reach our servers. We couldn't see your data even if we wanted to.",
            },
            {
              icon: <Users className="w-10 h-10 mb-4" />,
              title: "A Secure Safety Net",
              desc: "If you lose your master password, you can use a backup system involving three trusted friends. Any two of them can help you unlock your account.",
            },
            {
              icon: <Github className="w-10 h-10 mb-4" />,
              title: "Open and Honest",
              desc: "Our code is public and open-source. Anyone can check it to see exactly how your data is handled.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 border border-gray-900 hover:border-gray-700 rounded-xl transition-colors bg-gray-950/50"
            >
              <div className="text-white">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-white text-black py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-16 text-center">
            How You Get Back In
          </h2>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-200 z-0"></div>

            {[
              {
                icon: <UserPlus className="w-8 h-8 text-white" />,
                title: "1. Select your helpers",
                desc: "Choose three people you trust during setup.",
              },
              {
                icon: <MessageSquare className="w-8 h-8 text-white" />,
                title: "2. Request access",
                desc: "If you get locked out, ask them to confirm it’s really you.",
              },
              {
                icon: <Key className="w-8 h-8 text-white" />,
                title: "3. Restore your vault",
                desc: "Once two people confirm, you use a backup phrase to get back into your account.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mb-6 shadow-xl">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600 max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} VaultBox. Open Source & Secure.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
