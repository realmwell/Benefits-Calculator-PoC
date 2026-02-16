import { Link } from 'react-router-dom';

export function Nav() {
  return (
    <nav className="nav" role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        <Link to="/" className="nav-title">DC Benefits Finder</Link>
        <ul className="nav-links">
          <li><Link to="/questionnaire">Find Benefits</Link></li>
          <li><Link to="/chat">Ask a Question</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </div>
    </nav>
  );
}
