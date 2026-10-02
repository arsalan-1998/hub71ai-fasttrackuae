type BrandProps = { variant?: 'header' | 'sidebar' };

export function Brand({ variant = 'header' }: BrandProps) {
  return (
    <a className={`mad-brand mad-brand--${variant}`} href="/" aria-label="MAD home">
      <img src="/images/mad-symbol.svg" alt="" width={64} height={33} />
      <span className="mad-brand-name">MAD<small>ABU DHABI</small></span>
    </a>
  );
}
