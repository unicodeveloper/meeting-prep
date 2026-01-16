"use client";

export default function GitHubRibbon() {
  return (
    <a
      href="https://github.com/unicodeveloper/meeting-prep"
      target="_blank"
      rel="noopener noreferrer"
      className="github-ribbon"
      aria-label="Fork me on GitHub"
    >
      <span>Fork me on GitHub</span>
      <style jsx>{`
        .github-ribbon {
          position: fixed;
          top: 0;
          right: 0;
          z-index: 1000;
          width: 150px;
          height: 150px;
          overflow: hidden;
          pointer-events: none;
        }

        .github-ribbon span {
          position: absolute;
          display: block;
          width: 225px;
          padding: 8px 0;
          background-color: #151515;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          color: #fff;
          font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
          text-decoration: none;
          pointer-events: auto;
          top: 42px;
          right: -58px;
          transform: rotate(45deg);
          transition: background-color 0.2s ease;
        }

        .github-ribbon:hover span {
          background-color: #333;
        }
      `}</style>
    </a>
  );
}
