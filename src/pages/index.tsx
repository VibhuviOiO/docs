import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const setupGuides = [
  {
    title: '🏗️ Infrastructure Foundation',
    description: 'Self-hosted infrastructure setup with cost-effective solutions. Deploy your own services without cloud vendor lock-in.',
    items: ['Self-hosted Email & SSO', 'LDAP Setup', 'Git Server (Gitea/GitLab)', 'Self-hosted Collaboration Tools'],
    link: '/Infrastructure/terraform',
    icon: '🏗️',
  },
  {
    title: '⚙️ Development Workflow',
    description: 'Establish efficient development processes with self-hosted tools and proven best practices.',
    items: ['Self-hosted Ticketing', 'Git Workflow Standards', 'Code Review Best Practices', 'AI-Assisted Development'],
    link: '/CI-CD/CI/github-actions',
    icon: '⚙️',
  },
  {
    title: '🎯 Technology Stack',
    description: 'Choose the right technologies for your needs. Cost-effective, production-ready solutions.',
    items: ['Database Selection Guide', 'Architecture Patterns', 'Self-hosted vs Cloud', 'Cost Optimization'],
    link: '/Databases/NoSQL/mongodb',
    icon: '🎯',
  },
  {
    title: '🚢 CI/CD Automation',
    description: 'Build automated pipelines with self-hosted tools. Deploy faster, spend less.',
    items: ['Self-hosted Docker Registry', 'Build Automation', 'Deployment Strategies', 'Environment Setup'],
    link: '/harbor/harbor-setup',
    icon: '🚢',
  },
  {
    title: '🛡️ Security & Scanning',
    description: 'Implement security best practices with open-source tools. SAST, DAST, SCA without expensive licenses.',
    items: ['Self-hosted Vault', 'Container Scanning', 'Code Security Scanning', 'Secrets Management'],
    link: '/Security/vault',
    icon: '🛡️',
  },
  {
    title: '📈 Observability',
    description: 'Complete monitoring stack with self-hosted solutions. Full visibility at minimal cost.',
    items: ['Prometheus & Grafana', 'ELK Stack Setup', 'Distributed Tracing', 'Cost-effective Monitoring'],
    link: '/Observability/prometheus',
    icon: '📈',
  },
];

const featuredGuides = [
  {
    title: '🫧 Elastic Stack',
    description: 'Self-hosted search and analytics. Production-grade ELK stack setup.',
    link: '/ElasticStack',
    tags: ['Elasticsearch', 'Kibana', 'Self-hosted'],
  },
  {
    title: '☸️ Kubernetes',
    description: 'Build your own K8s cluster. No managed service fees.',
    link: '/k8s-cluster/Pre-requisites',
    tags: ['Kubernetes', 'Self-hosted', 'Cost-effective'],
  },
  {
    title: '🗄️ Databases',
    description: 'MongoDB, Redis, MinIO - all self-hosted and production-ready.',
    link: '/RunMongoDBForDev',
    tags: ['MongoDB', 'Redis', 'Self-hosted'],
  },
];

const bestPractices = [
  '💰 Cost-effective solutions over expensive cloud services',
  '🏠 Self-hosted infrastructure for full control',
  '🤖 AI-assisted development (Claude, Amazon Q, Kimi)',
  '⚡ Quick project setup in hours, not weeks',
  '📚 Validated, recommended practices',
  '🔧 No unnecessary tools - only what you need',
];

function SetupCard({title, description, items, link, icon}) {
  return (
    <div className={clsx('col col--4', styles.setupCard)}>
      <div className={styles.card}>
        <div className={styles.cardIcon}>{icon}</div>
        <div className={styles.cardBody}>
          <Heading as="h3" className={styles.cardTitle}>
            {title}
          </Heading>
          <p className={styles.cardDescription}>{description}</p>
          <ul className={styles.itemList}>
            {items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
          <Link to={link} className={styles.cardLink}>
            View Guide →
          </Link>
        </div>
      </div>
    </div>
  );
}

function GuideCard({title, description, link, tags}) {
  return (
    <div className={clsx('col col--4', styles.guideCard)}>
      <Link to={link} className={styles.guideLink}>
        <div className={styles.guideCardInner}>
          <Heading as="h4" className={styles.guideTitle}>
            {title}
          </Heading>
          <p className={styles.guideDescription}>{description}</p>
          <div className={styles.tags}>
            {tags.map((tag, idx) => (
              <span key={idx} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          Self-Hosted Infrastructure Guides
        </Heading>
        <p className={styles.heroSubtitle}>
          Cost-Effective, Production-Ready Solutions
        </p>
        <p className={styles.heroDescription}>
          Build your entire tech infrastructure with self-hosted, open-source tools.
          Validated practices for setting up production systems without expensive cloud services.
          Deploy what you need, when you need it.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="#guides">
            Start Building
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/ElasticStack">
            View Tutorials
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Self-hosted infrastructure guides for cost-effective, production-ready systems">
      <HomepageHeader />
      <main>
        <section className={styles.principles}>
          <div className="container">
            <div className="text--center margin-bottom--lg">
              <Heading as="h2">Our Approach</Heading>
            </div>
            <div className={styles.principleGrid}>
              {bestPractices.map((practice, idx) => (
                <div key={idx} className={styles.principleItem}>
                  {practice}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="guides" className={styles.setup}>
          <div className="container">
            <div className="text--center margin-bottom--xl">
              <Heading as="h2">🎯 Complete Setup Guides</Heading>
              <p className={styles.sectionSubtitle}>
                Everything you need to build production infrastructure yourself
              </p>
            </div>
            <div className="row">
              {setupGuides.map((props, idx) => (
                <SetupCard key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.featured}>
          <div className="container">
            <div className="text--center margin-bottom--lg">
              <Heading as="h2">📚 Featured Tutorials</Heading>
              <p className={styles.sectionSubtitle}>
                Step-by-step guides for self-hosting production systems
              </p>
            </div>
            <div className="row">
              {featuredGuides.map((props, idx) => (
                <GuideCard key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <div className="container">
            <div className={styles.ctaBox}>
              <Heading as="h2">Ready to Build Your Infrastructure?</Heading>
              <p>
                Follow our validated guides to set up production-ready infrastructure
                with cost-effective, self-hosted solutions. No expensive cloud bills.
              </p>
              <div className={styles.buttons}>
                <Link
                  className="button button--primary button--lg"
                  to="/Infrastructure/terraform">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
