import { useState } from 'react';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import Signature from './Signature';
import { Github, Instagram, Linkedin } from './BrandIcons';
import type { Content, Navigate } from '../types';

export default function Footer({ content, navigate }: { content: Content; navigate: Navigate }) {
  const { profile, pages } = content;
  const [signing, setSigning] = useState(false);
  return (
    <footer className="site-footer" id="footer">
      <div className="container">
        <div className="footer-top">
          <p>{pages.footerNote}</p>
          <div className="footer-social">
            {[
              { name: 'Instagram', url: profile.instagram, icon: Instagram },
              { name: 'GitHub', url: profile.github, icon: Github },
              { name: 'LinkedIn', url: profile.linkedin, icon: Linkedin },
            ]
              .filter((item) => !!item.url)
              .map(({ name, url, icon: Icon }) => (
                <a
                  key={name}
                  className="animated-link"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon size={14} />
                  {name}
                  <ArrowUpRight size={14} />
                </a>
              ))}
          </div>
          <button
            className="back-to-top"
            aria-label="Kembali ke atas"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'instant'
                  : 'smooth',
              })
            }
          >
            <ArrowUp size={20} />
          </button>
        </div>
        <div
          className={`footer-wordmark-wrap${signing ? ' is-signing' : ''}`}
          onMouseMove={() => !signing && setSigning(true)}
          onMouseLeave={() => setSigning(false)}
        >
          <a
            href="#home"
            onClick={(event) => {
              event.preventDefault();
              navigate('/');
            }}
            className="footer-wordmark"
            aria-label="Home"
          >
            {profile.brand}
            <span>.</span>
          </a>
          <Signature
            className="footer-signature"
            text={pages.signatureText || profile.name}
            image={pages.signatureImage}
          />
          <span className="footer-signoff">{content.copy.footerSignoff}</span>
        </div>
        <div className="footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} {profile.name}
          </span>
          <span>{content.copy.footerCredit}</span>
          <a
            href="/malak-portfolio/Malak_Elgwaely_CV.pdf" target="_blank" rel="noopener noreferrer"
          >
            {content.copy.footerAdmin} <ArrowUpRight size={11} />
          </a>
        </div>
      </div>
    </footer>
  );
}
