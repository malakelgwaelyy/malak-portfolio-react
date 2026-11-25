import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  ChevronDown,
  Code2,
  Layers,
  LoaderCircle,
  Mail,
  Minus,
  Mouse,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';
import gsap from 'gsap';
import { Github, Instagram, Linkedin } from '../components/BrandIcons';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Magnetic,
  ProjectCursor,
  reducedMotion,
  RevealLines,
  usePortfolioMotion,
} from '../components/Motion';
import Lanyard from '../components/InteractiveLanyard';
import Footer from '../components/Footer';
import MorphPortrait from '../components/MorphPortrait';
import Signature from '../components/Signature';
import { EducationSection, FrameworksSection } from '../components/Journey';
import type { Content, Navigate, Project } from '../types';

export function ProjectCard({
  project,
  navigate,
  index = 0,
}: {
  project: Project;
  navigate: Navigate;
  index?: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const tilt = (event: PointerEvent<HTMLAnchorElement>) => {
    if (reducedMotion() || event.pointerType !== 'mouse' || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    gsap.to(ref.current, {
      rotationY: (event.clientX - box.left - box.width / 2) / 160,
      rotationX: -(event.clientY - box.top - box.height / 2) / 180,
      transformPerspective: 1200,
      duration: 0.7,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };
  return (
    <a
      ref={ref}
      href={`/projects/${project.slug}`}
      className="project-card"
      data-project-cursor
      onClick={(event) => {
        event.preventDefault();
        navigate(`/projects/${project.slug}`);
      }}
      onPointerMove={tilt}
      onPointerLeave={() =>
        gsap.to(ref.current, { rotationX: 0, rotationY: 0, duration: 0.8, ease: 'power3.out' })
      }
      style={{ animationDelay: `${index * 65}ms` }}
    >
      <div className="project-image" data-image-reveal>
        <img
          src={project.image}
          alt={`${project.title}, ${project.category} concept`}
          loading="lazy"
          decoding="async"
          width="1100"
          height="760"
        />
        <span className="project-image-arrow">
          <ArrowUpRight size={21} />
        </span>
      </div>
      <div className="project-meta">
        <span>{project.category}</span>
        <span>{project.year}</span>
      </div>
      <div className="project-title-row">
        <h3>{project.title}</h3>
        <ArrowUpRight size={24} />
      </div>
      <p>{project.summary}</p>
    </a>
  );
}

function Projects({ content, navigate }: { content: Content; navigate: Navigate }) {
  const [filter, setFilter] = useState('All projects');
  const ordered = [...content.projects].sort(
    (first, second) => Number(second.featured) - Number(first.featured),
  );
  const filtered =
    filter === 'All projects' ? ordered : ordered.filter((project) => project.category === filter);
  useEffect(() => {
    const timer = setTimeout(() => ScrollTrigger.refresh(), 100);
    return () => clearTimeout(timer);
  }, [filter, content.projects.length]);
  const categories = [
    { name: 'All projects', label: content.copy.filterAll, icon: Layers },
    { name: 'Web Development', label: content.copy.filterWeb, icon: Code2 },
    { name: 'Data & AI', label: content.copy.filterDesign, icon: Braces },
  ];
  return (
    <section className="projects-section section" id="projects">
      <div className="container">
        <div className="section-heading centered" data-reveal>
          <span className="eyebrow">
            <span className="section-index">04 /</span> {content.copy.projectsEyebrow}
          </span>
          <h2>
            {content.pages.projectsTitle}
            <sup>({String(content.projects.length).padStart(2, '0')})</sup>
          </h2>
          <p>{content.pages.projectsDescription}</p>
        </div>
        <div className="project-filters" role="tablist" aria-label="Kategori project" data-reveal>
          {categories.map(({ name, label, icon: Icon }) => (
            <button
              key={name}
              type="button"
              role="tab"
              tabIndex={filter === name ? 0 : -1}
              id={`tab-${name.replace(/ /g, '-')}`}
              aria-controls="projects-panel"
              aria-selected={filter === name}
              className={filter === name ? 'selected' : ''}
              onClick={() => setFilter(name)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                  event.preventDefault();
                  const next =
                    (categories.findIndex((item) => item.name === filter) +
                      (event.key === 'ArrowRight' ? 1 : 2)) %
                    3;
                  setFilter(categories[next].name);
                  document
                    .getElementById(`tab-${categories[next].name.replace(/ /g, '-')}`)
                    ?.focus();
                }
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div
          className="projects-grid"
          id="projects-panel"
          role="tabpanel"
          aria-labelledby={`tab-${filter.replace(/ /g, '-')}`}
          key={filter}
        >
          {filtered.length ? (
            filtered.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} navigate={navigate} />
            ))
          ) : (
            <div className="empty-state">{content.copy.projectEmpty}</div>
          )}
        </div>
        <p className="projects-footnote" data-reveal>
          {content.copy.projectsFootnote}
          <a href="#contact" className="animated-link">
            {content.copy.projectsConversation} <ArrowUpRight size={14} />
          </a>
        </p>
      </div>
    </section>
  );
}

function CommunitySection({ content }: { content: Content }) {
  const entries = [
    { name: 'Shabab Be-Tesa’ed Shabab', role: 'Technologist · Web Track', detail: 'Taking part in a youth technology track focused on web development, learning alongside other young people and turning that learning into practical skills.', tag: 'TECHNOLOGY PROGRAM' },
    { name: 'Bibliotheca Alexandrina', role: 'Volunteer', detail: 'Contributed to cultural and public-facing activities, where being organized and attentive to visitors mattered as much as the event itself.', tag: 'CULTURE' },
    { name: 'Alexandria Book Fair', role: 'Event support', detail: 'Helped with the flow of a large public event and got a closer look at the coordination that makes it work.', tag: 'EVENTS' },
    { name: 'Resala & Baheya', role: 'Community initiatives', detail: 'Joined community activities connected to supporting people and contributing time where help is needed.', tag: 'COMMUNITY' },
    { name: 'Village children’s learning initiative', role: 'Weekly educational visits', detail: 'Took part in regular visits to villages to support children’s learning — an experience that made education feel very real and personal.', tag: 'EDUCATION' },
    { name: 'University graduation ceremonies', role: 'Organization team', detail: 'Helped organize university graduation events, coordinating details and working as part of a team under time pressure.', tag: 'TEAMWORK' },
  ];
  return (
    <section className="community-section section" id="community">
      <div className="container">
        <div className="community-heading" data-reveal>
          <div>
            <span className="eyebrow"><span className="section-index">03 /</span> {content.copy.communityEyebrow}</span>
            <h2>{content.copy.communityTitle}</h2>
          </div>
          <p>{content.copy.communityIntro}</p>
        </div>
        <div className="community-list">
          {entries.map((entry, index) => (
            <article className="community-entry" key={entry.name} data-reveal>
              <span className="community-number">0{index + 1}</span>
              <div className="community-main">
                <span className="community-tag">{entry.tag}</span>
                <h3>{entry.name}</h3>
                <span className="community-role">{entry.role}</span>
              </div>
              <p>{entry.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Services({ content }: { content: Content }) {
  const [expanded, setExpanded] = useState<string | null>(content.skills[0]?.id || null);
  const icons = [Code2, Layers, Sparkles];
  return (
    <section className="services-section section" id="skills">
      <div className="container services-layout">
        <div className="services-intro">
          <span className="eyebrow" data-reveal>
            <span className="section-index">02 /</span> {content.copy.skillsEyebrow}
          </span>
          <h2>
            <RevealLines text={content.pages.skillsTitle} />
          </h2>
          <p data-reveal>{content.copy.skillsDescription}</p>
          <ArrowDownRight
            className="services-arrow"
            size={48}
            strokeWidth={1}
            aria-hidden="true"
            data-reveal
          />
        </div>
        <div className="services-list">
          {content.skills.map((skill, index) => {
            const Icon = icons[index % icons.length];
            return (
              <article
                className={`service-row ${expanded === skill.id ? 'expanded' : ''}`}
                key={skill.id}
                data-reveal
              >
                <button
                  type="button"
                  className="service-heading"
                  aria-expanded={expanded === skill.id}
                  aria-controls={`skill-${skill.id}`}
                  onClick={() => {
                    setExpanded(expanded === skill.id ? null : skill.id);
                    setTimeout(() => ScrollTrigger.refresh(), 450);
                  }}
                >
                  <span className="service-number">0{index + 1}</span>
                  <Icon className="service-icon" size={22} />
                  <h3>{skill.title}</h3>
                  <span className="service-toggle">
                    {expanded === skill.id ? <Minus size={19} /> : <Plus size={19} />}
                  </span>
                </button>
                <div
                  className="service-body"
                  id={`skill-${skill.id}`}
                  inert={expanded !== skill.id}
                >
                  <div>
                    <p>{skill.description}</p>
                    <div className="service-tools">{skill.tools.join('  /  ')}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Contact({ content }: { content: Content }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setStatus('sending');
    setError('');
    try {
      const subject = encodeURIComponent(`Portfolio message from ${String(values.name || 'Visitor')}`);
      const body = encodeURIComponent(`${String(values.message || '')}\n\nFrom: ${String(values.name || '')}\nEmail: ${String(values.email || '')}`);
      window.location.href = `mailto:${content.profile.email}?subject=${subject}&body=${body}`;
      setStatus('success');
      form.reset();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Pesan belum terkirim. Silakan coba lagi.');
      setStatus('error');
    }
  };
  return (
    <section className="contact-section section" id="contact">
      <div className="container contact-layout">
        <div className="contact-copy">
          <span className="eyebrow" data-reveal>
            <span className="section-index">04 /</span> {content.copy.contactEyebrow}
          </span>
          <h2>
            <RevealLines text={content.pages.contactTitle} />
          </h2>
          <p data-reveal>{content.pages.contactDescription}</p>
          <a
            className="contact-email animated-link"
            href={`mailto:${content.profile.email}`}
            data-reveal
          >
            <Mail size={18} />
            {content.profile.email}
            <ArrowUpRight size={17} />
          </a>
          <div className="contact-availability" data-reveal>
            <span className={`status-dot ${content.profile.available ? '' : 'unavailable'}`} />
            {content.profile.available ? content.copy.contactAvailable : content.copy.contactBusy}
          </div>
        </div>
        <div className="contact-form-wrap" data-reveal>
          {status === 'success' ? (
            <div className="contact-success" role="status">
              <span className="success-symbol">
                <Check size={28} />
              </span>
              <span className="eyebrow">{content.copy.contactSuccessEyebrow}</span>
              <h3>{content.copy.contactSuccessTitle}</h3>
              <p>{content.copy.contactSuccessBody}</p>
              <button type="button" className="text-button" onClick={() => setStatus('idle')}>
                {content.copy.contactAnother} <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="contact-form">
              <div className="form-intro">
                <span>{content.copy.contactFormIntro}</span>
                <ArrowDownRight size={24} />
              </div>
              <div className="form-two-col">
                <label>
                  {content.copy.contactName} <span>*</span>
                  <input
                    name="name"
                    placeholder={content.copy.contactNamePlaceholder}
                    autoComplete="name"
                    minLength={2}
                    maxLength={150}
                    required
                  />
                </label>
                <label>
                  {content.copy.contactEmail} <span>*</span>
                  <input
                    type="email"
                    name="email"
                    placeholder={content.copy.contactEmailPlaceholder}
                    autoComplete="email"
                    maxLength={254}
                    required
                  />
                </label>
              </div>
              <label>
                {content.copy.contactMessage} <span>*</span>
                <textarea
                  name="message"
                  placeholder={content.copy.contactMessagePlaceholder}
                  rows={4}
                  minLength={10}
                  maxLength={5000}
                  required
                />
              </label>
              <label className="honeypot" aria-hidden="true">
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="contact-form-bottom">
                <span>{content.copy.contactPrivacy}</span>
                <Magnetic>
                  <button className="button primary" disabled={status === 'sending'} type="submit">
                    {status === 'sending'
                      ? content.copy.contactSending
                      : content.copy.contactSubmit}
                    {status === 'sending' ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </Magnetic>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Portfolio({
  content,
  navigate,
  entranceDelay,
}: {
  content: Content;
  navigate: Navigate;
  entranceDelay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  usePortfolioMotion(ref, entranceDelay);
  const { profile, pages } = content;
  return (
    <div ref={ref} className="portfolio">
      <div className="scroll-progress" aria-hidden="true">
        <span data-scroll-progress />
      </div>
      <ProjectCursor label={content.copy.projectView} />
      <main>
        <section className="hero" id="home">
          <div className="hero-stars" aria-hidden="true" />
          <div className="hero-orbit" aria-hidden="true" />
          <div className="container hero-layout">
            <div className="hero-words">
              <div className="hero-eyebrow hero-line">
                <span>
                  <span className="tiny-cross">+</span> {pages.heroEyebrow}
                </span>
              </div>
              <h1>
                <span className="hero-line hero-greeting">
                  <span>
                    {pages.heroGreeting}{' '}
                    <strong>
                      {profile.firstName}
                      <span className="hero-name-dot">.</span>
                    </strong>
                  </span>
                </span>
                <span className="hero-line">
                  <span>{pages.heroLineOne}</span>
                </span>
                <span className="hero-line">
                  <span className="hero-last-line">{pages.heroLineTwo}</span>
                </span>
              </h1>
              <p className="hero-copy">{profile.intro}</p>
              <div className="hero-actions">
                <Magnetic>
                  <a className="button primary" href="#projects">
                    {content.copy.heroExplore} <ArrowUpRight size={17} />
                  </a>
                </Magnetic>
                <Magnetic>
                  <a className="button secondary" href="#contact">
                    {content.copy.heroContact} <ArrowRight size={16} />
                  </a>
                </Magnetic>
              </div>
            </div>
          </div>
          <Lanyard profile={profile} card={content.card} />
          <div className="container hero-bottom">
            <div className="hero-socials">
              <span>{content.copy.findMe}</span>
              {profile.github && (
                <a
                  href={profile.github}
                  aria-label="GitHub"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github size={18} />
                </a>
              )}
              {profile.instagram && (
                <a
                  href={profile.instagram}
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram size={18} />
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin size={18} />
                </a>
              )}
            </div>
            <a href="#about" className="scroll-indicator">
              <Mouse size={17} />
              <span>{content.copy.scrollLabel}</span>
              <ArrowDown size={14} />
            </a>
            <span className="hero-location">
              {content.copy.heroLocationLabel} {profile.location.toUpperCase()}.
            </span>
          </div>
        </section>
        <section className="about-section section" id="about">
          <div className="container">
            <div className="section-heading centered" data-reveal>
              <span className="eyebrow">
                <span className="section-index">01 /</span> {content.copy.aboutEyebrow}
              </span>
              <h2>{pages.aboutTitle}</h2>
            </div>
            <div className="about-layout">
              <div className="about-intro">
                <span className="small-greeting" data-reveal>
                  {content.copy.aboutSmallGreeting}
                </span>
                <h3>
                  <RevealLines text={pages.aboutHeadline} />
                </h3>
                <a href="#contact" className="text-button animated-link" data-reveal>
                  {content.copy.aboutMeet} <ArrowUpRight size={17} />
                </a>
              </div>
              <div className="about-portrait" data-image-reveal>
                <MorphPortrait
                  src={profile.portrait}
                  alternate={profile.portraitHover}
                  alt={`${profile.name}, creative developer`}
                  signature={content.card.signatureText}
                  signatureImage={content.card.signatureImage}
                  parallax
                />
                <span className="portrait-corner tl" />
                <span className="portrait-corner br" />
              </div>
              <div className="about-description">
                <p data-reveal>{profile.about}</p>
                <p data-reveal>{profile.aboutMore}</p>
                <div className="about-signature" data-reveal>
                  <span className="about-signature-first">Malak</span>
                  <Signature
                    text={content.card.signatureText}
                    image={content.card.signatureImage}
                  />
                  <ArrowUpRight size={27} strokeWidth={1} />
                </div>
              </div>
            </div>
            <div className="about-bottom" data-reveal>
              <span>
                <span className="status-dot" />
                {content.copy.aboutLearning}
              </span>
              <a className="animated-link" href="#skills">
                {content.copy.aboutToolkit} <ChevronDown size={14} />
              </a>
            </div>
          </div>
        </section>
        <EducationSection content={content} />
        <CommunitySection content={content} />
        <Services content={content} />
        <FrameworksSection content={content} />
        <Projects content={content} navigate={navigate} />
        <Contact content={content} />
      </main>
      <Footer content={content} navigate={navigate} />
    </div>
  );
}
