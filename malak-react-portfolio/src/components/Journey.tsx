import { useState } from 'react';
import { ArrowUpRight, Check, GraduationCap, MapPin } from 'lucide-react';
import { RevealLines } from './Motion';
import TechnologyIcon from './TechnologyIcon';
import type { Content } from '../types';

export function EducationSection({ content }: { content: Content }) {
  if (!content.education.length) return null;
  return (
    <section className="education-section section" id="education">
      <div className="container education-layout">
        <div className="journey-intro">
          <span className="eyebrow" data-reveal>
            <span className="section-index">01.1 /</span>
            {content.copy.educationEyebrow}
          </span>
          <h2>
            <RevealLines text={content.pages.educationTitle} />
          </h2>
          <p data-reveal>{content.pages.educationDescription}</p>
          <GraduationCap
            className="journey-emblem"
            size={40}
            strokeWidth={1}
            data-reveal
            aria-hidden="true"
          />
        </div>
        <div className="education-timeline">
          <div className="education-line" aria-hidden="true">
            <span />
          </div>
          {content.education.map((item, index) => (
            <article className="education-entry" key={item.id} data-reveal>
              <span className="education-node" aria-hidden="true" />
              <div className="education-entry-top">
                <span className="education-period">{item.period}</span>
                <span className="education-step">0{index + 1}</span>
              </div>
              <div className="education-school-row">
                <div className="education-school-mark">
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt={`Logo ${item.school}`}
                      width="48"
                      height="48"
                      loading="lazy"
                    />
                  ) : (
                    <GraduationCap size={25} strokeWidth={1.3} />
                  )}
                </div>
                <div>
                  <h3>{item.school}</h3>
                  <span className="education-degree">{item.degree}</span>
                </div>
              </div>
              {item.description && <p>{item.description}</p>}
              {item.location && (
                <span className="education-location">
                  <MapPin size={11} />
                  {item.location}
                </span>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FrameworksSection({ content }: { content: Content }) {
  const [selected, setSelected] = useState(content.frameworks[0]?.id || '');
  const active = content.frameworks.find((item) => item.id === selected) || content.frameworks[0];
  if (!active) return null;
  return (
    <section className="frameworks-section section" id="frameworks">
      <div className="container">
        <div className="section-heading centered" data-reveal>
          <span className="eyebrow">
            <span className="section-index">02.1 /</span>
            {content.copy.frameworksEyebrow}
          </span>
          <h2>{content.pages.frameworksTitle}</h2>
          <p>{content.pages.frameworksDescription}</p>
        </div>
        <div className="frameworks-grid" role="group" aria-label="Framework dan teknologi">
          {content.frameworks.map((item) => (
            <button
              className={`framework-item ${item.id === active.id ? 'active' : ''}`}
              key={item.id}
              type="button"
              aria-pressed={item.id === active.id}
              onClick={() => setSelected(item.id)}
              data-reveal
            >
              <TechnologyIcon symbol={item.symbol} logo={item.logo} name={item.name} />
              <span>
                <strong>{item.name}</strong>
                <small>{item.category}</small>
              </span>
              {item.id === active.id ? <Check size={16} /> : <ArrowUpRight size={16} />}
            </button>
          ))}
        </div>
        <div className="framework-detail" aria-live="polite">
          <span className="framework-detail-label">{active.name}</span>
          <p key={active.id}>{active.description}</p>
          <span className="framework-detail-index">
            {String(content.frameworks.indexOf(active) + 1).padStart(2, '0')} /{' '}
            {String(content.frameworks.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </section>
  );
}
