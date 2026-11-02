import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Vote, Shield, Lock, Zap, Users, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'Every vote is encrypted and stored on the Ethereum blockchain, ensuring maximum security and immutability.'
    },
    {
      icon: Lock,
      title: 'Face Recognition',
      description: 'Advanced biometric authentication ensures one person, one vote with cutting-edge face recognition technology.'
    },
    {
      icon: Zap,
      title: 'Real-time Results',
      description: 'Watch election results update in real-time with our live dashboard and instant vote counting.'
    },
    {
      icon: Users,
      title: 'Transparent Process',
      description: 'Complete transparency with publicly verifiable votes while maintaining voter privacy and anonymity.'
    }
  ];

  const stats = [
    { label: 'Total Votes Cast', value: '10,000+', icon: Vote },
    { label: 'Active Elections', value: '25+', icon: CheckCircle },
    { label: 'Registered Users', value: '5,000+', icon: Users },
    { label: 'Success Rate', value: '99.9%', icon: Sparkles }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-20 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-4xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-glass)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">
              <Sparkles className="h-3.5 w-3.5" /> Next-gen Civic Tech
            </span>
            <h1 className="mt-6 text-4xl font-bold sm:text-5xl md:text-6xl">
              Secure, Transparent &amp; <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Decentralized Voting</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground sm:text-xl">
              Every vote is encrypted, verified and permanently recorded on the blockchain. Empowering citizens and administrators with a trustworthy, modern electoral system.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="xl" icon={ArrowRight}>
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" icon={Sparkles}>
                      Create your account
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline">
                      Sign in
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Card className="border text-left bg-card">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
                    <Shield className="h-6 w-6 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">Tamper-proof Elections</p>
                    <p className="text-sm text-muted-foreground">Immutable audit trails with end-to-end encryption and on-chain verification.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border text-left bg-card">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                    <Users className="h-6 w-6 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-purple-200">Trust at Scale</p>
                    <p className="text-sm text-muted-foreground">Biometric verification, wallet binding and real-time insights keep every voter accounted for.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Metrics that matter</span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Trusted by communities everywhere</h2>
            <p className="mt-1 text-sm text-muted-foreground">Our infrastructure scales from municipal ballots to nationwide elections without sacrificing transparency or speed.</p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border text-center bg-card">
                    <CardContent className="p-8">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15">
                        <Icon className="h-6 w-6 text-blue-300" />
                      </div>
                      <p className="text-3xl font-semibold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform pillars</span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Why administrators choose us</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every module is battle-tested with best-in-class security, compliance and user experience baked in.</p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card className="border bg-card">
                    <CardContent className="space-y-4 p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/25 via-purple-500/25 to-pink-500/25">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold">{feature.title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-heading text-center">
            <span className="section-heading__eyebrow">Four simple steps</span>
            <h2 className="section-heading__title">From onboarding to verified voting</h2>
            <p className="section-heading__subtitle">We streamline identity verification, wallet onboarding and vote casting so every citizen can participate confidently.</p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '01', title: 'Register', desc: 'Create your secure account and validate credentials with Aadhaar-backed KYC.' },
              { step: '02', title: 'Face Scan', desc: 'Complete biometric verification to enforce the one-person-one-vote principle.' },
              { step: '03', title: 'Connect Wallet', desc: 'Bind your MetaMask wallet to sign transactions and receive tamper-proof proofs.' },
              { step: '04', title: 'Cast Vote', desc: 'Browse elections, review candidates and submit your vote in seconds.' }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="border bg-card">
                  <CardContent className="space-y-3 p-6">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-300">
                      {item.step}
                    </span>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden border bg-primary text-primary-foreground">
              <CardContent className="space-y-6 px-6 py-12 text-center sm:px-16">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
                  <Vote className="h-4 w-4" /> Start today
                </div>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Ready to modernize your election infrastructure?
                </h2>
                <p className="mx-auto max-w-2xl text-base opacity-90">
                  Launch pilot programs, collect feedback and scale confidently. Our team partners with administrators end-to-end, from smart contract deployment to voter education.
                </p>
                {!isAuthenticated && (
                  <Link to="/register">
                    <Button size="lg" variant="secondary" icon={ArrowRight}>
                      Create your administrator account
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
