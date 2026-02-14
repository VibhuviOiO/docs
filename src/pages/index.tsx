import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import { useState, useEffect } from 'react';
import styles from './index.module.css';

const products = [
  {
    title: 'Docker Registry UI',
    description: 'Modern web interface for managing private Docker registries with multi-registry support',
    status: 'Production',
    link: 'https://vibhuvioio.com/docker-registry-ui/',
    docsLink: '/docs/Databases/NoSQL/mongodb',
  },
  {
    title: 'LDAP Manager',
    description: 'Web-based LDAP directory management for users, groups, and organizational units',
    status: 'Production',
    link: 'https://vibhuvioio.com/ldap-manager/',
    docsLink: '/docs/LDAP/intro',
  },
  {
    title: 'OpenLDAP Docker',
    description: 'Production-ready OpenLDAP container with SSL, overlays, and sensible defaults',
    status: 'Production',
    link: 'https://github.com/VibhuviOiO/openldap-docker',
    docsLink: '/docs/LDAP/intro',
  },
  {
    title: 'Uptime O',
    description: 'Uptime monitoring and observability platform with dashboards and intelligent alerting',
    status: 'In Development',
    link: '/products',
    docsLink: '/docs/Observability/prometheus',
  },
  {
    title: 'SolrLens',
    description: 'Apache Solr cluster monitoring with query analytics and health tracking',
    status: 'Coming Soon',
    link: '/products',
    docsLink: '/docs/SearchAnalytics/elasticsearch',
  },
];

const docCategories = [
  {
    title: 'Infrastructure',
    count: '20+',
    description: 'Terraform, Ansible, and foundational automation',
    link: '/docs/Infrastructure/terraform',
  },
  {
    title: 'Databases',
    count: '40+',
    description: 'Relational, NoSQL, and specialized stores',
    link: '/docs/Databases/NoSQL/mongodb',
  },
  {
    title: 'Kubernetes',
    count: '15+',
    description: 'Cluster operations and orchestration',
    link: '/docs/k8s-cluster/Pre-requisites',
  },
  {
    title: 'Security',
    count: '10+',
    description: 'Identity, secrets, and compliance',
    link: '/docs/Security/vault',
  },
  {
    title: 'Observability',
    count: '25+',
    description: 'Monitoring, logging, and tracing',
    link: '/docs/Observability/prometheus',
  },
  {
    title: 'CI/CD',
    count: '15+',
    description: 'Pipelines and deployment automation',
    link: '/docs/CI-CD/CI/github-actions',
  },
];

function ProductCard({title, description, status, link, docsLink}: {
  title: string;
  description: string;
  status: string;
  link: string;
  docsLink: string;
}) {
  const isProduction = status === 'Production';
  const isDevelopment = status === 'In Development';
  
  return (
    <div className={styles.productCard}>
      <div className={styles.productHeader}>
        <h3 className={styles.productTitle}>{title}</h3>
        <span className={clsx(
          styles.statusBadge,
          isProduction && styles.statusProduction,
          isDevelopment && styles.statusDevelopment
        )}>
          {status}
        </span>
      </div>
      <p className={styles.productDescription}>{description}</p>
      <div className={styles.productActions}>
        <a href={link} className={styles.productLink} target="_blank" rel="noopener noreferrer">
          Website
        </a>
        <Link to={docsLink} className={styles.docsLink}>
          Documentation
        </Link>
      </div>
    </div>
  );
}

function DocCategory({title, count, description, link}: {
  title: string;
  count: string;
  description: string;
  link: string;
}) {
  return (
    <Link to={link} className={styles.categoryCard}>
      <div className={styles.categoryHeader}>
        <h3 className={styles.categoryTitle}>{title}</h3>
        <span className={styles.categoryCount}>{count}</span>
      </div>
      <p className={styles.categoryDescription}>{description}</p>
    </Link>
  );
}

const rotatingPhrases = [
  'Infrastructure Boring.',
  'Deployments Seamless.',
  'Operations Invisible.',
  'Monitoring Effortless.',
];

function RotatingText() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = rotatingPhrases[phraseIndex];

    if (!isDeleting && charCount < currentPhrase.length) {
      const timeout = setTimeout(() => setCharCount(charCount + 1), 150);
      return () => clearTimeout(timeout);
    }

    if (!isDeleting && charCount === currentPhrase.length) {
      const timeout = setTimeout(() => setIsDeleting(true), 3500);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && charCount > 0) {
      const timeout = setTimeout(() => setCharCount(charCount - 1), 60);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && charCount === 0) {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % rotatingPhrases.length);
    }
  }, [charCount, isDeleting, phraseIndex]);

  const currentPhrase = rotatingPhrases[phraseIndex];

  return (
    <span className={styles.heroHighlight}>
      {currentPhrase.slice(0, charCount)}
      <span className={styles.cursor}>|</span>
    </span>
  );
}

export default function Home(): React.JSX.Element {
  return (
    <Layout
      title="Open Source Infrastructure Tools | Self-Hosted DevOps & SRE"
      description="VibhuviOiO builds production-grade open source infrastructure tools for self-hosted deployments, monitoring, and operations. 140+ guides, 5 products, battle-tested in production.">

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <Heading as="h1" className={styles.heroTitle}>
              We Make Your
              <RotatingText />
            </Heading>
            <p className={styles.heroSubtitle}>We handle the ops. You ship the code.</p>
            <p className={styles.heroLead}>
              Production-ready open source tools and battle-tested automation
              for teams that want infrastructure they never have to think about.
            </p>
            <div className={styles.heroActions}>
              <Link to="/products" className={styles.primaryButton}>
                Explore Products
              </Link>
              <Link to="/docs/intro" className={styles.secondaryButton}>
                Read the Docs
              </Link>
            </div>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>140+</span>
              <span className={styles.statLabel}>Guides</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>5</span>
              <span className={styles.statLabel}>Products</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>100%</span>
              <span className={styles.statLabel}>Open Source</span>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Centralised Operations */}
        <section className={styles.featureSection}>
          <div className="container">
            <div className={styles.orbitLayout}>
              {/* Badge above title */}
              <div className={styles.orbitBadgeWrapper}>
                <span className={styles.orbitBadge}>AI-Powered Platform</span>
              </div>
              
              {/* Title at top */}
              <h2 className={styles.orbitTitle}>Everything Connected</h2>
              
              {/* Left item */}
              <div className={styles.orbitItemLeft}>
                <div className={styles.orbitPoint}>
                  <span className={styles.orbitPointIconHub}>◉</span>
                  <span className={styles.orbitPointText}>Unified control plane for infrastructure</span>
                </div>
              </div>
              
              {/* Center animation */}
              <div className={styles.orbitCenter}>
                <div className={styles.centralisedAnim}>
                  <div className={styles.hubCenter}>
                    <span className={styles.hubIcon}>◉</span>
                  </div>
                  <div className={styles.orbitRing}>
                    <span className={styles.orbitNode} style={{ ['--angle' as string]: '0deg' }}>◈</span>
                    <span className={styles.orbitNode} style={{ ['--angle' as string]: '72deg' }}>◈</span>
                    <span className={styles.orbitNode} style={{ ['--angle' as string]: '144deg' }}>◈</span>
                    <span className={styles.orbitNode} style={{ ['--angle' as string]: '216deg' }}>◈</span>
                    <span className={styles.orbitNode} style={{ ['--angle' as string]: '288deg' }}>◈</span>
                  </div>
                  <div className={styles.orbitRing2}>
                    <span className={styles.orbitNode2} style={{ ['--angle' as string]: '36deg' }}>◇</span>
                    <span className={styles.orbitNode2} style={{ ['--angle' as string]: '108deg' }}>◇</span>
                    <span className={styles.orbitNode2} style={{ ['--angle' as string]: '180deg' }}>◇</span>
                    <span className={styles.orbitNode2} style={{ ['--angle' as string]: '252deg' }}>◇</span>
                    <span className={styles.orbitNode2} style={{ ['--angle' as string]: '324deg' }}>◇</span>
                  </div>
                </div>
              </div>
              
              {/* Top right item */}
              <div className={styles.orbitItemTopRight}>
                <div className={styles.orbitPoint}>
                  <span className={styles.orbitPointIconInner}>◈</span>
                  <span className={styles.orbitPointText}>AI-assisted tools built for your stack</span>
                </div>
              </div>
              
              {/* Bottom right item */}
              <div className={styles.orbitItemBottomRight}>
                <div className={styles.orbitPoint}>
                  <span className={styles.orbitPointIconOuter}>◇</span>
                  <span className={styles.orbitPointText}>On-demand products for infrastructure needs</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conscious Operations */}
        <section className={clsx(styles.featureSection, styles.featureSectionAlt)}>
          <div className="container">
            <div className={styles.consciousLayout}>
              {/* Badge above title */}
              <div className={styles.consciousBadgeWrapper}>
                <span className={styles.consciousBadge}>Zero Stress Ops</span>
              </div>
              
              {/* Title at top */}
              <h2 className={styles.consciousTitle}>Sleep Soundly</h2>
              
              {/* Left items */}
              <div className={styles.consciousItemLeftTop}>
                <div className={styles.consciousPoint}>
                  <span className={styles.consciousIconShield}>🛡</span>
                  <span className={styles.consciousPointText}>Stable by default. No firefighting.</span>
                </div>
              </div>
              
              <div className={styles.consciousItemLeftBottom}>
                <div className={styles.consciousPoint}>
                  <span className={styles.consciousIconMoon}>☾</span>
                  <span className={styles.consciousPointText}>No 3 AM pages. No deployment anxiety.</span>
                </div>
              </div>
              
              {/* Center animation */}
              <div className={styles.consciousCenter}>
                <div className={styles.consciousAnim}>
                  {/* Moon/shield core */}
                  <div className={styles.consciousCore}>
                    <span className={styles.coreIcon}>☽</span>
                  </div>
                  
                  {/* Gentle pulse rings */}
                  <div className={styles.pulseRing1}></div>
                  <div className={styles.pulseRing2}></div>
                  <div className={styles.pulseRing3}></div>
                  
                  {/* Floating Z's */}
                  <span className={styles.floatingZ1}>Z</span>
                  <span className={styles.floatingZ2}>z</span>
                  <span className={styles.floatingZ3}>Z</span>
                  
                  {/* Stars */}
                  <span className={styles.star1}>✦</span>
                  <span className={styles.star2}>✧</span>
                  <span className={styles.star3}>✦</span>
                </div>
              </div>
              
              {/* Right item */}
              <div className={styles.consciousItemRight}>
                <div className={styles.consciousPoint}>
                  <span className={styles.consciousIconCheck}>✓</span>
                  <span className={styles.consciousPointText}>Proactive monitoring. Automated remediation.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLA / SLO / SLI */}
        <section className={styles.featureSection}>
          <div className="container">
            <div className={styles.standardsLayout}>
              {/* Badge */}
              <div className={styles.standardsBadgeWrapper}>
                <span className={styles.standardsBadge}>Reliability First</span>
              </div>
              
              {/* Title */}
              <h2 className={styles.standardsTitle}>Built on Industry Standards</h2>
              
              {/* Center Content with Bridge */}
              <div className={styles.standardsCenterFull}>
                <p className={styles.standardsLead}>
                  Every system is measured against real reliability targets — 
                  not just uptime numbers, but SLAs, SLOs, and SLIs that your 
                  business can depend on.
                </p>
                <div className={styles.standardsFeatures}>
                  <span className={styles.standardFeature}>Error Budgets</span>
                  <span className={styles.standardFeature}>Latency Targets</span>
                  <span className={styles.standardFeature}>Availability Guarantees</span>
                </div>
                {/* Bridge moved to left side */}
                <div className={styles.standardsBridgeLeft}>
                  <span className={styles.floatingStandardSmall}>SLA</span>
                  <span className={styles.bridgeArrowSmall}>→</span>
                  <span className={styles.floatingStandardSmall}>SLO</span>
                  <span className={styles.bridgeArrowSmall}>→</span>
                  <span className={styles.floatingStandardSmall}>SLI</span>
                  <span className={styles.bridgeArrowSmall}>→</span>
                  <span className={styles.floatingStandardSmallLong}>Uptime Observability</span>
                </div>
              </div>
              
              {/* Right Animation - Targets/Goals */}
              <div className={styles.standardsRight}>
                <div className={styles.targetsAnim}>
                  {/* Outer ring - larger */}
                  <div className={styles.targetRingOuter}></div>
                  {/* Middle ring */}
                  <div className={styles.targetRing}></div>
                  {/* Inner ring */}
                  <div className={styles.targetRingInner}></div>
                  {/* Checkmark center */}
                  <div className={styles.targetCheck}>✓</div>
                  
                  {/* Inner orbit - small badges close to center, evenly spaced */}
                  <span className={styles.orbitingBadgeInner1} style={{ ['--angle' as string]: '0deg' }}>SLA</span>
                  <span className={styles.orbitingBadgeInner2} style={{ ['--angle' as string]: '120deg' }}>SLO</span>
                  <span className={styles.orbitingBadgeInner3} style={{ ['--angle' as string]: '240deg' }}>SLI</span>
                  
                  {/* Middle orbit - at medium distance */}
                  <span className={styles.orbitingBadgeMiddle1} style={{ ['--angle' as string]: '60deg' }}>Uptime</span>
                  <span className={styles.orbitingBadgeMiddle2} style={{ ['--angle' as string]: '180deg' }}>Observability</span>
                  
                  {/* Outer orbit - furthest out */}
                  <span className={styles.orbitingBadgeOuter1} style={{ ['--angle' as string]: '0deg' }}>99.9%</span>
                  <span className={styles.orbitingBadgeOuter2} style={{ ['--angle' as string]: '120deg' }}>Latency</span>
                  <span className={styles.orbitingBadgeOuter3} style={{ ['--angle' as string]: '240deg' }}>Errors</span>
                </div>
              </div>
              
            </div>
          </div>
        </section>

        {/* We Listen to Your Team */}
        <section className={clsx(styles.featureSection, styles.listenSection)}>
          <div className="container">
            {/* Header */}
            <div className={styles.listenHeader}>
              <div className={styles.listenBadgeWrapper}>
                <span className={styles.listenBadge}>Collaborative Approach</span>
              </div>
              <h2 className={styles.listenTitle}>We Listen to Your Team</h2>
              <p className={styles.listenSubtitle}>
                We turn complex conversations into simple, actionable solutions.
              </p>
            </div>

            {/* Sound Wave Visualization */}
            <div className={styles.listenWaveContainer}>
              {/* Central Ear/Listening Element */}
              <div className={styles.listenCenter}>
                <div className={styles.earIcon}>
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M32 8C20 8 12 18 12 30c0 8 4 14 10 18v6c0 4 4 6 8 6s8-2 8-6v-4c0-4-2-6-4-8-2-2-4-4-4-8 0-4 4-8 8-8s8 4 8 8" 
                          stroke="url(#earGrad)" strokeWidth="3" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="earGrad" x1="12" y1="8" x2="52" y2="56">
                        <stop stopColor="#5020e8"/>
                        <stop offset="1" stopColor="#00bcd4"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span className={styles.listenLabel}>Listening</span>
              </div>

              {/* Sound Waves */}
              <div className={styles.soundWaves}>
                <span className={styles.wave}></span>
                <span className={styles.wave}></span>
                <span className={styles.wave}></span>
                <span className={styles.wave}></span>
                <span className={styles.wave}></span>
              </div>

              {/* Team Voices - 8 positions */}
              <div className={styles.teamVoices}>
                {/* Top voices */}
                <div className={clsx(styles.voice, styles.voiceTopLeft)}>
                  <div className={styles.voiceDot}></div>
                  <span className={styles.voiceLabel}>Tech Stack</span>
                </div>
                <div className={clsx(styles.voice, styles.voiceTop)}>
                  <div className={styles.voiceDot}></div>
                  <span className={styles.voiceLabel}>CI/CD</span>
                </div>
                <div className={clsx(styles.voice, styles.voiceTopRight)}>
                  <div className={styles.voiceDot}></div>
                  <span className={styles.voiceLabel}>GitOps</span>
                </div>
                
                {/* Side voices */}
                <div className={clsx(styles.voice, styles.voiceLeft)}>
                  <div className={styles.voiceDot}></div>
                  <span className={styles.voiceLabel}>Security</span>
                </div>
                <div className={clsx(styles.voice, styles.voiceRight)}>
                  <div className={styles.voiceDot}></div>
                  <span className={styles.voiceLabel}>Monitoring</span>
                </div>
                
                {/* Bottom voices */}
                <div className={clsx(styles.voice, styles.voiceBottomLeft)}>
                  <div className={styles.voiceDot}></div>
                  <span className={styles.voiceLabel}>Pain Points</span>
                </div>
                <div className={clsx(styles.voice, styles.voiceBottom)}>
                  <div className={styles.voiceDot}></div>
                  <span className={styles.voiceLabel}>Cost Control</span>
                </div>
                <div className={clsx(styles.voice, styles.voiceBottomRight)}>
                  <div className={styles.voiceDot}></div>
                  <span className={styles.voiceLabel}>Alert Hell</span>
                </div>
              </div>

              {/* Connecting Lines - each badge has its own dedicated line */}
              <svg className={styles.listenLines} viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5020e8" stopOpacity="0.9"/>
                    <stop offset="100%" stopColor="#00bcd4" stopOpacity="0.9"/>
                  </linearGradient>
                </defs>
                {/* Tech Stack line */}
                <line className={clsx(styles.connectLine, styles.lineTechStack)} x1="300" y1="200" x2="100" y2="60" />
                {/* CI/CD line */}
                <line className={clsx(styles.connectLine, styles.lineCICD)} x1="300" y1="200" x2="300" y2="35" />
                {/* GitOps line */}
                <line className={clsx(styles.connectLine, styles.lineGitOps)} x1="300" y1="200" x2="500" y2="60" />
                {/* Security line */}
                <line className={clsx(styles.connectLine, styles.lineSecurity)} x1="300" y1="200" x2="35" y2="200" />
                {/* Monitoring line */}
                <line className={clsx(styles.connectLine, styles.lineMonitoring)} x1="300" y1="200" x2="565" y2="200" />
                {/* Pain Points line */}
                <line className={clsx(styles.connectLine, styles.linePainPoints)} x1="300" y1="200" x2="100" y2="340" />
                {/* Cost Control line */}
                <line className={clsx(styles.connectLine, styles.lineCostControl)} x1="300" y1="200" x2="300" y2="365" />
                {/* Alert Hell line */}
                <line className={clsx(styles.connectLine, styles.lineAlertHell)} x1="300" y1="200" x2="500" y2="340" />
              </svg>
            </div>

            {/* Text Below Animation */}
            <div className={styles.listenTextBlock}>
              <p className={styles.listenTextLead}>
                Thinking complex is simple. Making things simple is complex.
              </p>
              <p className={styles.listenTextBody}>
                The possibility of complexity is higher, so we think simple. 
                We listen to your team to understand systems.
              </p>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Products</h2>
              <p className={styles.sectionDescription}>
                Open source tools that solve real infrastructure problems — ready to deploy today
              </p>
            </div>
            <div className={styles.productsList}>
              {products.map((props, idx) => (
                <ProductCard key={idx} {...props} />
              ))}
            </div>
            <div className={styles.sectionAction}>
              <Link to="/products" className={styles.textLink}>
                View all products
              </Link>
            </div>
          </div>
        </section>

        {/* Documentation Section */}
        <section className={clsx(styles.section, styles.sectionAlt)}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Documentation</h2>
              <p className={styles.sectionDescription}>
                Battle-tested guides from real production environments — no theory, just what works
              </p>
            </div>
            <div className={styles.categoriesGrid}>
              {docCategories.map((props, idx) => (
                <DocCategory key={idx} {...props} />
              ))}
            </div>
            <div className={styles.sectionAction}>
              <Link to="/docs/intro" className={styles.primaryButton}>
                Explore Documentation
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className={styles.bottomCta}>
          <div className="container">
            <div className={styles.bottomCtaContent}>
              <h2>Ready to Simplify Your Infrastructure?</h2>
              <p>
                Everything is open source. Start deploying in minutes, not weeks.
              </p>
              <Link to="/docs/intro" className={styles.primaryButton}>
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
