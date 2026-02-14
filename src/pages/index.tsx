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
            <div className={styles.featureRow}>
              <div className={styles.featureImage}>
                <img src="/img/centralised-ops.png" alt="Centralised infrastructure operations" />
              </div>
              <div className={styles.featureContent}>
                <h2 className={styles.featureTitle}>Centralised Operations</h2>
                <p className={styles.featureText}>
                  One team. One platform. Complete visibility across your entire
                  infrastructure — databases, containers, networking, and security
                  managed from a single pane of glass.
                </p>
                <p className={styles.featureText}>
                  No more juggling vendors or context-switching between tools.
                  We bring everything together so your team stays focused.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Conscious Operations */}
        <section className={clsx(styles.featureSection, styles.featureSectionAlt)}>
          <div className="container">
            <div className={clsx(styles.featureRow, styles.featureRowReverse)}>
              <div className={styles.featureImage}>
                <img src="/img/consious-ops.png" alt="Stress-free conscious operations" />
              </div>
              <div className={styles.featureContent}>
                <h2 className={styles.featureTitle}>Conscious Operations</h2>
                <p className={styles.featureText}>
                  No firefighting. No 3 AM pages. No deployment anxiety.
                  We design systems that are stable by default — so your
                  on-call engineers can actually sleep.
                </p>
                <p className={styles.featureText}>
                  Proactive monitoring, automated remediation, and
                  runbooks that handle incidents before they become outages.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SLA / SLO / SLI */}
        <section className={styles.featureSection}>
          <div className="container">
            <div className={styles.featureRow}>
              <div className={styles.featureImage}>
                <img src="/img/sla-slo-sli.png" alt="SLA SLO SLI reliability standards" />
              </div>
              <div className={styles.featureContent}>
                <h2 className={styles.featureTitle}>Built on Industry Standards</h2>
                <p className={styles.featureText}>
                  Every system we build is measured against SLAs, SLOs, and SLIs.
                  Not just uptime numbers — real reliability targets that your
                  business and customers can depend on.
                </p>
                <p className={styles.featureText}>
                  Error budgets, latency targets, and availability guarantees —
                  the same practices used by the best platform teams in the world.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* We Listen */}
        <section className={clsx(styles.featureSection, styles.featureSectionAlt)}>
          <div className="container">
            <div className={clsx(styles.featureRow, styles.featureRowReverse)}>
              <div className={styles.featureImage}>
                <img src="/img/we-listen-to-your-team.jpeg" alt="We listen to your team" />
              </div>
              <div className={styles.featureContent}>
                <h2 className={styles.featureTitle}>We Listen to Your Team</h2>
                <p className={styles.featureText}>
                  Every infrastructure is different. We start by understanding
                  your stack, your workflows, and your pain points — then build
                  solutions that fit your team, not the other way around.
                </p>
                <p className={styles.featureText}>
                  Collaborative, transparent, and always aligned with what
                  your engineers actually need to ship faster.
                </p>
              </div>
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
