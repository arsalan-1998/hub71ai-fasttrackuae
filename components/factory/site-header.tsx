import { Brand } from './brand';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Brand />
      <nav aria-label="Main navigation">
        <a href="/#benefits">Why Abu Dhabi</a>
        <a href="/#comparison">Compare</a>
        <a href="/#faq">FAQs</a>
      </nav>
      <a className="site-button" href="/get-started">Get started</a>
    </header>
  );
}
