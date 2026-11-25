import type { CSSProperties } from 'react';
import type { IdentityCardContent, Profile } from '../types';
import MorphPortrait from './MorphPortrait';

export default function IdentityBadge({
  profile,
  card,
  priority = false,
}: {
  profile: Profile;
  card: IdentityCardContent;
  priority?: boolean;
}) {
  const name = card.displayName || profile.name;
  const brand = card.brandText || profile.brand;
  return (
    <div
      className="identity-badge"
      style={
        { '--card-accent': card.accentColor, '--card-paper': card.paperColor } as CSSProperties
      }
    >
      <div className="badge-punch" />
      <div className="badge-topline">
        <span className="badge-symbol">
          {card.logoImage ? (
            <img src={card.logoImage} alt={`Logo ${brand}`} />
          ) : (
            <>
              {brand.charAt(0)}
              <span>.</span>
            </>
          )}
        </span>
        <span>
          {card.heading}
          <br />
          {(card.roleText || profile.role).toUpperCase()}
        </span>
        <span className="badge-edition">
          {card.editionLabel}
          <br />
          {card.editionYear}
        </span>
      </div>
      <div
        className="badge-title"
        style={{ fontSize: `${Math.min(69, 552 / Math.max(1, card.titleLineOne.length))}px` }}
      >
        {card.titleLineOne}
        <br />
        <span
          className="badge-role-line"
          style={{ fontSize: `${Math.min(60, 540 / Math.max(1, card.titleLineTwo.length))}px` }}
        >
          {card.titleLineTwo}
        </span>
        <span className="badge-star">{card.mark}</span>
      </div>
      <div className="badge-photo">
        <MorphPortrait
          src={card.portrait || profile.portrait}
          alternate={card.portraitHover || profile.portraitHover}
          alt={`Portrait ${name}`}
          signature={card.signatureText}
          signatureImage={card.signatureImage}
          priority={priority}
        />
        <span className="badge-photo-caption">{card.photoCaption}</span>
      </div>
      <div className="badge-name">
        <span style={{ fontSize: `${Math.min(20, 390 / Math.max(1, name.length))}px` }}>
          {name.toUpperCase()}
        </span>
        <span>{card.identifier}</span>
      </div>
      <div className="badge-bottom">
        <span>
          {card.footerLineOne}
          <br />
          {card.footerLineTwo}
        </span>
        <div className="barcode" />
        <span className="badge-small-logo">{brand}.</span>
      </div>
    </div>
  );
}
