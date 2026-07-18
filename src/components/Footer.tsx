const Footer = () => {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="max-w-3xl mx-auto px-7 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted">
        <span className="font-serif italic">
          © {new Date().getFullYear()} Björn Allvin · made with care for the fasting community
        </span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/bjornallvin/fast-track"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-clay transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://github.com/bjornallvin/fast-track/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-clay transition-colors"
          >
            Report an issue
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
