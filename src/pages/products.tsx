import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './products.module.css';

const liveProducts = [
  {
    title: 'Docker Registry UI',
    description: 'Modern web interface for Docker Registry. Browse, manage, and organize your container images with an intuitive UI. Features tag management, image deletion, and multi-registry support.',
    link: 'https://vibhuvioio.com/docker-registry-ui/',
    github: 'https://github.com/VibhuviOiO/docker-registry-ui',
    tags: ['Docker', 'Registry', 'Container Management'],
  },
  {
    title: 'LDAP Manager',
    description: 'Simplified LDAP management interface for teams. Manage users, groups, and organizational units through a clean web UI. No LDAP command line knowledge required.',
    link: 'https://vibhuvioio.com/ldap-manager/',
    github: 'https://github.com/VibhuviOiO/ldap-manager',
    tags: ['LDAP', 'Identity', 'SSO', 'User Management'],
  },
  {
    title: 'OpenLDAP Docker',
    description: 'Production-ready OpenLDAP Docker image with sensible defaults, SSL/TLS support, and easy configuration. Includes memberof overlay and custom schema support out of the box.',
    link: 'https://github.com/VibhuviOiO/openldap-docker',
    github: 'https://github.com/VibhuviOiO/openldap-docker',
    tags: ['Docker', 'LDAP', 'Identity', 'SSO'],
  },
];

const upcomingProducts = [
  {
    title: 'Uptime O',
    description: 'Modern uptime observability platform with beautiful dashboards, multi-region monitoring, and intelligent alerting. SaaS version coming with additional enterprise features.',
    status: 'Beta',
    features: ['Uptime Monitoring', 'Status Pages', 'Alerting', 'SaaS Ready'],
  },
  {
    title: 'SolrLens',
    description: 'Unified monitoring for Apache Solr clusters. Track query performance, index statistics, and node health across all your Solr instances in one place.',
    status: 'Coming Soon',
    features: ['Solr Monitoring', 'Query Analytics', 'Cluster Health', 'Alerts'],
  },
  {
    title: 'Suchaka',
    description: 'Self-hosted status page for your services. Keep your users informed about system status, incidents, and maintenance windows. Simple to deploy and customize.',
    status: 'Live',
    github: 'https://github.com/VibhuviOiO/suchaka',
    tags: ['Status Page', 'Monitoring', 'Self-hosted'],
  },
];

const futureProducts = [
  {
    title: 'Infra Mirror',
    description: 'End-to-end infrastructure visibility. Know your infrastructure uptime before anyone reports. Comprehensive monitoring for your entire stack.',
    status: 'Coming Soon',
  },
  {
    title: 'Container Talks',
    description: 'Short, practical tutorials for containerizing any technology. Quick guides to get your applications running in containers with best practices.',
    status: 'Coming Soon',
  },
];

function LiveProductCard({title, description, link, github, tags}) {
  return (
    <div className={clsx('col col--4', styles.productCard)}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={clsx(styles.status, styles.statusLive)}>Live</span>
        </div>
        <div className={styles.cardBody}>
          <Heading as="h3" className={styles.cardTitle}>
            {title}
          </Heading>
          <p className={styles.cardDescription}>{description}</p>
          <div className={styles.tags}>
            {tags.map((tag, idx) => (
              <span key={idx} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.cardFooter}>
          <a href={link} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
            View Product →
          </a>
          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer" className={styles.githubLink}>
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function UpcomingProductCard({title, description, status, features, github, tags}: {
  title: string;
  description: string;
  status: string;
  features?: string[];
  github?: string;
  tags?: string[];
}) {
  const isBeta = status === 'Beta';
  const isLive = status === 'Live';
  
  return (
    <div className={clsx('col col--4', styles.productCard)}>
      <div className={clsx(styles.card, styles.upcomingCard)}>
        <div className={styles.cardHeader}>
          <span className={clsx(
            styles.status,
            isLive && styles.statusLive,
            isBeta && styles.statusBeta,
            !isLive && !isBeta && styles.statusComingSoon
          )}>
            {status}
          </span>
        </div>
        <div className={styles.cardBody}>
          <Heading as="h3" className={styles.cardTitle}>
            {title}
          </Heading>
          <p className={styles.cardDescription}>{description}</p>
          {features && (
            <div className={styles.featureList}>
              {features.map((feature, idx) => (
                <span key={idx} className={styles.featureTag}>
                  {feature}
                </span>
              ))}
            </div>
          )}
          {tags && (
            <div className={styles.tags}>
              {tags.map((tag, idx) => (
                <span key={idx} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {(isLive || isBeta) && github && (
          <div className={styles.cardFooter}>
            <a href={github} target="_blank" rel="noopener noreferrer" className={styles.githubLink}>
              GitHub →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function FutureProductCard({title, description, status}) {
  return (
    <div className={clsx('col col--6', styles.productCard)}>
      <div className={clsx(styles.card, styles.futureCard)}>
        <div className={styles.cardHeader}>
          <span className={clsx(styles.status, styles.statusComingSoon)}>{status}</span>
        </div>
        <div className={styles.cardBody}>
          <Heading as="h3" className={styles.cardTitle}>
            {title}
          </Heading>
          <p className={styles.cardDescription}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage(): React.JSX.Element {
  return (
    <Layout
      title="Open Source Infrastructure Products"
      description="Self-hosted, open-source infrastructure tools by VibhuviOiO. Docker Registry UI, LDAP Manager, Uptime monitoring, and more.">
      <header className={styles.header}>
        <div className="container">
          <Heading as="h1" className={styles.title}>
            Open Source Products
          </Heading>
          <p className={styles.subtitle}>
            Infrastructure tools I built to solve real problems. 
            All open source, self-hosted, and production-ready.
          </p>
        </div>
      </header>
      
      <main>
        {/* Live Products */}
        <section className={styles.productsSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>Available Now</span>
              <h2 className={styles.sectionTitle}>Live Products</h2>
            </div>
            <div className="row">
              {liveProducts.map((props, idx) => (
                <LiveProductCard key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming/Beta Products */}
        <section className={clsx(styles.productsSection, styles.upcomingSection)}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={clsx(styles.sectionTag, styles.betaTag)}>In Development</span>
              <h2 className={styles.sectionTitle}>Upcoming Products</h2>
            </div>
            <div className="row">
              {upcomingProducts.map((props, idx) => (
                <UpcomingProductCard key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        {/* Future Products */}
        <section className={styles.productsSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className={clsx(styles.sectionTag, styles.roadmapTag)}>Roadmap</span>
              <h2 className={styles.sectionTitle}>Future Ideas</h2>
            </div>
            <div className="row">
              {futureProducts.map((props, idx) => (
                <FutureProductCard key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        {/* SaaS CTA for Uptime O */}
        <section className={styles.saasCta}>
          <div className="container">
            <div className={styles.saasBox}>
              <div className={styles.saasContent}>
                <span className={styles.saasBadge}>SaaS Coming Soon</span>
                <h2>Uptime O</h2>
                <p>
                  We're building a managed version of Uptime O with additional enterprise 
                  features, multi-region monitoring, and 24/7 support. 
                  Join the waitlist to get early access.
                </p>
                <div className={styles.saasFeatures}>
                  <div className={styles.saasFeature}>
                    <span>🌍</span>
                    <span>Multi-region monitoring</span>
                  </div>
                  <div className={styles.saasFeature}>
                    <span>📱</span>
                    <span>Mobile apps</span>
                  </div>
                  <div className={styles.saasFeature}>
                    <span>🔔</span>
                    <span>Advanced alerting</span>
                  </div>
                  <div className={styles.saasFeature}>
                    <span>📊</span>
                    <span>Custom dashboards</span>
                  </div>
                </div>
              </div>
              <div className={styles.saasAction}>
                <div className={styles.waitlistForm}>
                  <p>Want early access?</p>
                  <a 
                    href="mailto:hello@vibhuvioio.com?subject=Uptime O Waitlist" 
                    className={clsx('button button--primary button--lg', styles.waitlistButton)}>
                    Join Waitlist
                  </a>
                  <span className={styles.waitlistNote}>Or email: hello@vibhuvioio.com</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Documentation CTA */}
        <section className={styles.cta}>
          <div className="container">
            <div className={styles.ctaBox}>
              <Heading as="h2">Need Setup Help?</Heading>
              <p>
                Each product has comprehensive documentation. Check out our guides 
                for deployment, configuration, and best practices.
              </p>
              <Link
                className="button button--primary button--lg"
                to="/">
                Browse Documentation
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
