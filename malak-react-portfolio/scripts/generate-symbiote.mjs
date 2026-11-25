import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

// The costume is registered to the sample portrait, so the pose never jumps on reveal.
const head =
  'M 139 310 C 111 265 146 205 199 170 C 248 133 304 114 369 132 C 434 142 474 190 479 254 C 489 302 471 368 435 419 L 433 459 L 455 510 L 489 555 L 448 640 L 336 700 L 281 637 L 252 552 L 211 535 C 192 527 188 498 184 480 L 171 447 L 166 419 L 149 413 Q 135 405 145 391 L 154 368 L 146 343 Z';
const body =
  'M 455 503 Q 480 554 526 580 C 579 601 666 626 707 674 L 720 720 L 720 1080 L 0 1080 L 0 839 Q 25 728 56 682 Q 122 629 250 565 L 281 617 L 335 670 L 405 598 Z';
const headWeb = [
  'M 167 185 Q 239 260 213 370 Q 197 453 225 539',
  'M 250 141 Q 295 228 254 326 Q 222 424 263 553 L 319 658',
  'M 341 126 Q 364 242 311 342 Q 286 452 344 596 L 352 672',
  'M 428 161 Q 433 267 380 359 Q 350 444 417 572',
  'M 142 263 Q 204 233 276 238 Q 385 238 475 282',
  'M 144 310 Q 215 275 299 291 Q 391 292 472 335',
  'M 156 365 Q 217 335 293 349 Q 371 354 450 395',
  'M 150 410 Q 215 393 283 411 Q 361 416 435 452',
  'M 178 463 Q 239 452 306 470 Q 371 478 452 513',
  'M 202 515 Q 263 505 328 532 Q 386 544 463 559',
  'M 267 579 Q 335 566 436 609',
  'M 293 623 Q 339 612 395 640',
];
const bodyWeb = [];
for (let x = -120; x <= 840; x += 105)
  bodyWeb.push(`<path d="M ${x} 562 Q ${x + 70} 790 ${x + 35} 1100"/>`);
for (let y = 630; y <= 1120; y += 85)
  bodyWeb.push(`<path d="M -30 ${y} Q 330 ${y + 100} 755 ${y - 10}"/>`);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080">
<defs>
 <linearGradient id="face" x1="140" y1="300" x2="480" y2="355" gradientUnits="userSpaceOnUse"><stop stop-color="#3d4347"/><stop offset=".27" stop-color="#242a30"/><stop offset=".65" stop-color="#13191f"/><stop offset="1" stop-color="#070c12"/></linearGradient>
 <linearGradient id="suit" x1="80" y1="630" x2="690" y2="1000" gradientUnits="userSpaceOnUse"><stop stop-color="#192129"/><stop offset=".5" stop-color="#090f16"/><stop offset="1" stop-color="#03080d"/></linearGradient>
 <linearGradient id="eye" x1="180" y1="316" x2="280" y2="375" gradientUnits="userSpaceOnUse"><stop stop-color="#fafcfb"/><stop offset=".4" stop-color="#d8e2e7"/><stop offset="1" stop-color="#6b7d89"/></linearGradient>
 <linearGradient id="metal"><stop stop-color="#c3ced5"/><stop offset=".5" stop-color="#eef1ef"/><stop offset="1" stop-color="#727f89"/></linearGradient>
 <radialGradient id="shine"><stop stop-color="#a9b6c5" stop-opacity=".18"/><stop offset="1" stop-color="#7c91ab" stop-opacity="0"/></radialGradient>
 <clipPath id="head"><path d="${head}"/></clipPath><clipPath id="body"><path d="${body}"/></clipPath>
 <filter id="cloth"><feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .65 0 0 0 0 .7 0 0 0 0 .75 0 0 0 .13 0"/></filter>
</defs>
<path d="${body}" fill="url(#suit)"/>
<g clip-path="url(#body)" fill="none" stroke="#84909a" stroke-width="1.3" opacity=".24">${bodyWeb.join('')}</g>
<g clip-path="url(#body)"><path d="M 67 674 Q 154 773 137 1077 M 622 641 Q 529 792 584 1080 M 330 695 Q 368 864 345 1080" stroke="#a5b0ba" stroke-width="18" opacity=".035" fill="none"/><rect width="720" height="1080" filter="url(#cloth)" opacity=".3"/></g>
<path d="${head}" fill="url(#face)" stroke="#919ca4" stroke-opacity=".27" stroke-width="1.3"/>
<g clip-path="url(#head)"><ellipse cx="220" cy="278" rx="180" ry="200" fill="url(#shine)"/><ellipse cx="345" cy="482" rx="85" ry="155" fill="url(#shine)"/><rect x="110" y="120" width="390" height="580" filter="url(#cloth)" opacity=".5"/>
<g fill="none" stroke="#9ca8b2" stroke-width="1.7" opacity=".3">${headWeb.map((d) => `<path d="${d}"/>`).join('')}</g></g>
<path d="M 169 340 Q 211 298 296 298 Q 265 355 214 388 Q 182 384 169 340 Z" fill="#050a10" stroke="#67747c" stroke-width="1.5"/>
<path d="M 182 341 Q 222 311 279 312 Q 250 349 211 374 Q 189 370 182 341 Z" fill="url(#eye)"/>
<path d="M 153 350 Q 135 362 130 386 Q 148 383 166 371 Z" fill="#070c12" stroke="#6c7a84" stroke-width="1.3"/>
<path d="M 151 357 Q 141 369 138 377 L 158 368 Z" fill="#dce5e9"/>
<path d="M 176 388 Q 165 405 176 413 M 184 447 Q 213 439 242 448 M 214 510 Q 263 522 295 493" stroke="#a2b0bb" stroke-opacity=".14" stroke-width="2.4" fill="none"/>
<g transform="translate(357 748) rotate(9)" fill="url(#metal)" opacity=".83">
<ellipse cx="0" cy="0" rx="12" ry="23"/><path d="M-9 15 L-15 63 L0 85 L15 63 L9 15 Z"/>
<path d="M-10-15 L-58-54 L-91-68 L-62-60 L-4-28Z M10-15 L58-54 L91-68 L62-60 L4-28Z M-9-5 L-79-23 L-107-4 L-76-13 L-7 5Z M9-5 L79-23 L107-4 L76-13 L7 5Z M-9 10 L-71 28 L-91 81 L-64 36 L-4 23Z M9 10 L71 28 L91 81 L64 36 L4 23Z M-9 26 L-44 65 L-54 132 L-35 72 L0 42Z M9 26 L44 65 L54 132 L35 72 L0 42Z"/>
</g></svg>`;
const backgroundPatch = await sharp('public/images/portrait.webp')
  .extract({ left: 70, top: 320, width: 40, height: 110 })
  .resize(95, 110)
  .toBuffer();
const prepared = await sharp('public/images/portrait.webp')
  .composite([{ input: backgroundPatch, left: 90, top: 320 }])
  .png()
  .toBuffer();
await sharp(prepared)
  .composite([{ input: Buffer.from(svg) }])
  .webp({ quality: 91 })
  .toFile('public/images/portrait-symbiote.webp');
mkdirSync('artifacts', { recursive: true });
await sharp(prepared)
  .composite([{ input: Buffer.from(svg) }])
  .png()
  .toFile('artifacts/symbiote-preview.png');
console.log('Created a pose-registered Black Suit portrait.');
