import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './products.module.css';

const products = [
  {
    title: '🐳 Docker Registry UI',
    description: 'Modern web interface for Docker Registry. Manage your container images with an intuitive UI.',
    status: 'Live',
    link: 'https://vibhuvioio.com/docker-registry-ui/',
    github: 'https://github.com/VibhuviOiO/docker-registry-ui',
    tags: ['Docker', 'Registry', 'UI', 'Container Management'],
  },
  {
    title: '🔐 LDAP Manager',
    description: 'Simplified LDAP management interface. Manage users, groups, and directory services easily.',
    status: 'Live',
    link: 'https://vibhuvioio.com/ldap-manager/',
    github: 'https://github.com/VibhuviOiO/ldap-manager',
    tags: ['LDAP', 'Identity', 'User Management', 'SSO'],
  },
  {
    title: '📊 Suchaka',
    description: 'Self-hosted status page for monitoring your services. Keep your users informed about system status.',
    status: 'Live',
    link: 'https://github.com/VibhuviOiO/suchaka',
    github: 'https://github.com/VibhuviOiO/suchaka',
    tags: ['Status Page', 'Monitoring', 'Self-hosted'],
  },
  {
    title: '⏱️ Uptime O',
    description: 'Uptime observability platform. Monitor your infrastructure and get instant alerts.',
    status: 'Coming Soon',
    tags: ['Uptime', 'Monitoring', 'Observability', 'Alerts'],
  },
  {
    title: '🔍 Infra Mirror',
    description: 'Know your infrastructure uptime before anyone reports. End-to-end infrastructure visibility and monitoring.',
    status: 'Coming Soon',
    tags: ['Infrastructure', 'Monitoring', 'Uptime', 'Visibility'],
  },
  {
    title: '📦 Container Talks',
    description: 'Short tutorials for containerizing any technology. Quick guides to get your apps running in containers.',
    status: 'Coming Soon',
    tags: ['Docker', 'Containers', 'Tutorials', 'DevOps'],
  },
  {
    title: '🔎 SolrLens',
    description: 'Monitor all your Solr clusters in one place. Get alerts for unexpected behavior and performance issues.',
    status: 'Coming Soon',
    tags: ['Solr', 'Monitoring', 'Search', 'Observability'],
  },
];

function ProductCard({title, description, status, link, github, tags}) {
  const isLive = status === 'Live';
  
  return (
    <div className={clsx('col col--4', styles.productCard)}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={clsx(styles.status, isLive ? styles.statusLive : styles.statusComingSoon)}>
            {status}
          </span>
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
        {isLive && (
          <div className={styles.cardFooter}>
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                View Product →
              </a>
            )}
            {github && (
              <a href={github} target="_blank" rel="noopener noreferrer" className={styles.githubLink}>
                GitHub
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Products(): JSX.Element {
  return (
    <Layout
      title="Open Source Products"
      description="Self-hosted, open-source infrastructure tools by VibhuviOiO">
      <header className={styles.header}>
        <div className="container">
          <Heading as="h1" className={styles.title}>
            Open Source Products
          </Heading>
          <p className={styles.subtitle}>
            Self-hosted infrastructure tools built for developers and DevOps teams
          </p>
        </div>
      </header>
      <main>
        <section className={styles.products}>
          <div className="container">
            <div className="row">
              {products.map((props, idx) => (
                <ProductCard key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <div className="container">
            <div className={styles.ctaBox}>
              <Heading as="h2">Need Setup Guides?</Heading>
              <p>
                Check out our comprehensive documentation for setting up these tools
                and other infrastructure components.
              </p>
              <Link
                className="button button--primary button--lg"
                to="/">
                View Documentation
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
