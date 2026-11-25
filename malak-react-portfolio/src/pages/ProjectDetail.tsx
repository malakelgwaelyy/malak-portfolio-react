import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Maximize2 } from 'lucide-react';
import { usePortfolioMotion, RevealLines, Magnetic } from '../components/Motion';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import type { Content, Navigate, Project } from '../types';

export default function ProjectDetail({
  project,
  content,
  navigate,
}: {
  project: Project;
  content: Content;
  navigate: Navigate;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState<string | null>(null);
  usePortfolioMotion(ref);
  const index = content.projects.findIndex((item) => item.id === project.id);
  const next = content.projects[(index + 1) % content.projects.length];
  return (
    <div ref={ref} className="project-detail">
      <main>
        <section className="detail-heading container">
          <a
            href="/#projects"
            className="text-button animated-link"
            onClick={(event) => {
              event.preventDefault();
              navigate('/#projects');
            }}
            data-reveal
          >
            <ArrowLeft size={16} />
            {content.copy.projectBack}
          </a>
          <div className="detail-title-row">
            <div>
              <span className="eyebrow" data-reveal>
                {project.category} / {project.year}
              </span>
              <h1>
                <RevealLines text={project.title} />
              </h1>
            </div>
            <span className="detail-number" data-reveal>
              0{index + 1}
            </span>
          </div>
          <p data-reveal>{project.summary}</p>
          <div className="detail-facts" data-reveal>
            <div>
              <span>{content.copy.projectDiscipline}</span>
              <p>{project.category}</p>
            </div>
            <div>
              <span>{content.copy.projectToolkit}</span>
              <p>{project.tools.join(' / ')}</p>
            </div>
            <div>
              <span>{content.copy.projectYear}</span>
              <p>{project.year}</p>
            </div>
            {project.url ? (
              <Magnetic>
                <a
                  className="button primary"
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {content.copy.projectVisit}
                  <ArrowUpRight size={16} />
                </a>
              </Magnetic>
            ) : (
              <span className="concept-label">
                {content.copy.projectConcept}
                <ArrowUpRight size={15} />
              </span>
            )}
          </div>
        </section>
        <div className="detail-cover" data-image-reveal>
          <img
            src={project.image}
            alt={`Presentasi ${project.title}`}
            width="1100"
            height="760"
            fetchPriority="high"
          />
          <button
            className="detail-zoom icon-button"
            aria-label="Perbesar gambar project"
            onClick={() => setZoomed(project.image)}
          >
            <Maximize2 size={20} />
          </button>
        </div>
        <section className="detail-story container">
          <div data-reveal>
            <span className="eyebrow">{content.copy.projectIdea}</span>
            <h2>
              <RevealLines text={content.copy.projectIdeaTitle} />
            </h2>
          </div>
          <div>
            <p data-reveal>{project.description}</p>
            {project.challenge && (
              <>
                <h3 data-reveal>{content.copy.projectApproach}</h3>
                <p data-reveal>{project.challenge}</p>
              </>
            )}
          </div>
        </section>
        {project.gallery.length > 0 && (
          <section className="detail-gallery container" aria-label="Galeri project">
            {project.gallery.map((image, imageIndex) => (
              <button
                type="button"
                key={`${image}-${imageIndex}`}
                className="detail-gallery-image"
                onClick={() => setZoomed(image)}
                data-image-reveal
              >
                <img
                  data-parallax
                  src={image}
                  alt={`${project.title}, detail ${imageIndex + 1}`}
                  loading="lazy"
                  width="1200"
                  height="800"
                />
                <span className="gallery-enlarge">
                  <Maximize2 size={18} /> {content.copy.galleryLabel}
                </span>
              </button>
            ))}
          </section>
        )}
        {next && next.id !== project.id && (
          <section className="next-project container" data-reveal>
            <span className="eyebrow">
              {content.copy.projectUpNext} / 0{((index + 1) % content.projects.length) + 1}
            </span>
            <a
              href={`/projects/${next.slug}`}
              onClick={(event) => {
                event.preventDefault();
                navigate(`/projects/${next.slug}`);
              }}
            >
              <h2>{next.title}</h2>
              <ArrowRight size={55} strokeWidth={1} />
            </a>
          </section>
        )}
      </main>
      <Footer content={content} navigate={navigate} />
      {zoomed && (
        <Modal
          title={`Gambar ${project.title}`}
          onClose={() => setZoomed(null)}
          className="image-modal"
        >
          <img src={zoomed} alt={`Detail project ${project.title}`} />
        </Modal>
      )}
    </div>
  );
}
