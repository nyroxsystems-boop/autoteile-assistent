import { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumb?: string[];
  actions?: ReactNode;
};

const PageHeader = ({ title, subtitle, breadcrumb, actions }: PageHeaderProps) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginBottom: 8
      }}
    >
      {breadcrumb && breadcrumb.length ? (
        <div style={{ color: 'var(--muted)', fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
          {breadcrumb.map((item, idx) => (
            <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span>{item}</span>
              {idx < breadcrumb.length - 1 ? <span style={{ opacity: 0.5 }}>•</span> : null}
            </span>
          ))}
        </div>
      ) : null}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{title}</div>
          {subtitle ? <div style={{ color: 'var(--muted)', marginTop: 4 }}>{subtitle}</div> : null}
        </div>
        {actions ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div> : null}
      </div>
    </div>
  );
};

export default PageHeader;
