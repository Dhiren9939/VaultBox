import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  LockKeyhole,
  Users,
  Inbox,
  KeyRound,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

const LandingPage = () => {
  const capabilityCards = [
    {
      icon: <LockKeyhole className="w-6 h-6" />,
      title: 'Client-side vault encryption',
      description:
        'Your passwords are encrypted on your device before they leave your browser.',
    },
    {
      icon: <Inbox className="w-6 h-6" />,
      title: 'Dead-drop shard exchange',
      description:
        'Recovery shards are transferred through private dead drops between trusted users.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Trustee-based recovery',
      description:
        'Recovery starts only after you have at least 3 accepted trustees in your vault network.',
    },
  ];

  const recoveryFlow = [
    {
      title: 'Set up trustees',
      detail:
        'Choose trusted people and have them accept your shard so your protection score reaches 3/3.',
    },
    {
      title: 'Start a recovery session',
      detail:
        'If locked out, begin recovery with your account email and an intermediate password for that session.',
    },
    {
      title: 'Collect 3 approvals',
      detail:
        'At least three trustees must contribute encrypted shards before recovery can finalize.',
    },
    {
      title: 'Rotate and continue',
      detail:
        'Finalize with a new master password to rotate keys and restore full vault access.',
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white font-sans selection:bg-white selection:text-black">
      <style>{`
        @keyframes drift {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-14px) translateX(10px); }
          100% { transform: translateY(0px) translateX(0px); }
        }

        @keyframes reveal {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .landing-reveal {
          opacity: 0;
          animation: reveal 0.8s ease-out forwards;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-16 h-80 w-80 rounded-full bg-white/8 blur-3xl [animation:drift_8s_ease-in-out_infinite]" />
        <div className="absolute top-24 right-0 h-96 w-96 rounded-full bg-gray-500/10 blur-3xl [animation:drift_10s_ease-in-out_infinite]" />
      </div>

      <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
          <ShieldCheck className="h-7 w-7 text-white" />
          VaultBox
        </div>
        <div className="space-x-3">
          <Link
            to="/login"
            className="inline-block rounded-xl border border-gray-800 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-900"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <header className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-6 pb-20 pt-10 md:grid-cols-[1.25fr_1fr] md:items-center md:pb-24">
        <div className="landing-reveal space-y-7 [animation-delay:0.08s]">
          <p className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-300">
            <Sparkles className="h-4 w-4" />
            Secure Password + Recovery System
          </p>
          <h1 className="text-5xl font-bold leading-[0.98] tracking-tight text-white sm:text-6xl md:text-7xl">
            Built to keep your vault recoverable, not fragile.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-gray-400 sm:text-xl">
            Lock every password behind encryption that happens on your own
            device, then back yourself up with trusted people so one forgotten
            password never ends your access.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-base font-bold text-black transition hover:bg-gray-200"
            >
              Create My Vault
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-800 px-7 py-4 text-base font-semibold text-gray-200 transition hover:bg-gray-900"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        <div className="landing-reveal rounded-3xl border border-gray-800 bg-gray-950/80 p-6 shadow-2xl [animation-delay:0.22s] md:p-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
            Product Snapshot
          </p>
          <div className="space-y-4">
            {[
              'Vault entries with client-side encryption',
              'Dead-drop inbox for shard acceptance or rejection',
              'Recovery center with trustee status and request handling',
              'Session-based recovery requiring at least 3 shard approvals',
            ].map((line) => (
              <div key={line} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                <p className="text-sm font-medium text-gray-300">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20">
        <h2 className="mb-6 text-3xl font-bold tracking-tight text-white md:text-4xl">
          What VaultBox Actually Delivers
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {capabilityCards.map((card, index) => (
            <div
              key={card.title}
              className="landing-reveal rounded-2xl border border-gray-800 bg-gray-950/80 p-6"
              style={{ animationDelay: `${0.12 + index * 0.1}s` }}
            >
              <div className="mb-4 inline-flex rounded-xl bg-white/10 p-3 text-white">
                {card.icon}
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">{card.title}</h3>
              <p className="leading-relaxed text-gray-400">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 border-y border-gray-900 bg-gray-950 py-20 text-gray-100">
        <div className="mx-auto w-full max-w-6xl px-6">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Recovery Sequence
          </h2>
          <p className="mb-10 max-w-2xl text-gray-400">
            This flow mirrors the current backend and frontend recovery
            implementation.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {recoveryFlow.map((step, index) => (
              <div
                key={step.title}
                className="landing-reveal rounded-2xl border border-gray-800 bg-black p-5"
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                    Step {index + 1}
                  </span>
                  <KeyRound className="h-5 w-5 text-gray-300" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-gray-500 md:flex-row">
        <p>&copy; {new Date().getFullYear()} VaultBox</p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 font-bold text-white hover:text-gray-300"
        >
          Start building your recovery network
          <ChevronRight className="h-4 w-4" />
        </Link>
      </footer>
    </div>
  );
};

export default LandingPage;
