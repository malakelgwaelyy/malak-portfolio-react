export interface Profile {
  name: string;
  firstName: string;
  brand: string;
  role: string;
  location: string;
  available: boolean;
  portrait: string;
  portraitHover: string;
  intro: string;
  about: string;
  aboutMore: string;
  email: string;
  github: string;
  instagram: string;
  linkedin: string;
}

export interface PageContent {
  heroGreeting: string;
  heroLineOne: string;
  heroLineTwo: string;
  heroEyebrow: string;
  aboutTitle: string;
  aboutHeadline: string;
  educationTitle: string;
  educationDescription: string;
  frameworksTitle: string;
  frameworksDescription: string;
  skillsTitle: string;
  projectsTitle: string;
  projectsDescription: string;
  contactTitle: string;
  contactDescription: string;
  footerNote: string;
  signatureText?: string;
  signatureImage?: string;
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  tools: string[];
}

export interface IdentityCardContent {
  heading: string;
  roleText: string;
  mark: string;
  titleLineOne: string;
  titleLineTwo: string;
  editionLabel: string;
  editionYear: string;
  portrait: string;
  portraitHover: string;
  photoCaption: string;
  displayName: string;
  identifier: string;
  footerLineOne: string;
  footerLineTwo: string;
  strapText: string;
  brandText: string;
  logoImage: string;
  signatureText: string;
  signatureImage: string;
  accentColor: string;
  paperColor: string;
  dragHint: string;
  keyboardHint: string;
  resetLabel: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  period: string;
  location: string;
  description: string;
  logo: string;
}

export interface Framework {
  id: string;
  name: string;
  category: string;
  description: string;
  symbol: string;
  logo: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  description: string;
  challenge: string;
  image: string;
  gallery: string[];
  tools: string[];
  url: string;
  featured: boolean;
}

export interface AppSettings {
  languageMode: boolean;
  language: string;
}

export interface Content {
  profile: Profile;
  pages: PageContent;
  skills: Skill[];
  projects: Project[];
  card: IdentityCardContent;
  education: Education[];
  frameworks: Framework[];
  copy: Record<string, string>;
  settings: AppSettings;
}

export interface AuthState {
  authenticated: boolean;
  mustChangePassword: boolean;
  csrfToken: string;
  username?: string;
}

export interface Message {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
  is_read: number;
}

export type Navigate = (to: string) => void;
