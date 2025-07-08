import type { Locale } from './i18n';

export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  locale?: Locale;
  alternates?: Array<{ lang: Locale; url: string }>;
}

export function generateSEOTags(data: SEOData) {
  const {
    title,
    description,
    keywords,
    image = '/assets/og-image.jpg',
    url,
    type = 'website',
    locale = 'vi',
    alternates = []
  } = data;

  const siteName = 'IQ Test Free';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return {
    title: fullTitle,
    description,
    keywords,
    openGraph: {
      title: fullTitle,
      description,
      image,
      url,
      type,
      siteName,
      locale
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      image
    },
    alternates,
    canonical: url
  };
}

export function generateQuizSchema(data: {
  name: string;
  description: string;
  timeRequired: string;
  numberOfQuestions: number;
  locale: Locale;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: data.name,
    description: data.description,
    timeRequired: data.timeRequired,
    numberOfQuestions: data.numberOfQuestions,
    inLanguage: data.locale,
    creator: {
      '@type': 'Organization',
      name: 'IQ Test Free',
      url: 'https://your-domain.com'
    },
    hasPart: {
      '@type': 'Question',
      name: 'IQ Test Questions',
      acceptedAnswerFormat: 'MultipleChoice'
    }
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function generateWebsiteSchema(locale: Locale) {
  const urls = {
    vi: 'https://your-domain.com',
    en: 'https://your-domain.com/en',
    es: 'https://your-domain.com/es'
  };

  const names = {
    vi: 'Test IQ Miễn Phí',
    en: 'Free IQ Test',
    es: 'Test de CI Gratis'
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: names[locale],
    url: urls[locale],
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${urls[locale]}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

export function generateResultSchema(data: {
  score: number;
  maxScore: number;
  timeTaken: number;
  correctAnswers: number;
  totalQuestions: number;
  locale: Locale;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    reviewBody: `IQ Test completed with score ${data.score}/${data.maxScore}`,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: data.score,
      bestRating: data.maxScore,
      worstRating: 0
    },
    author: {
      '@type': 'Person',
      name: 'Anonymous User'
    },
    itemReviewed: {
      '@type': 'Quiz',
      name: 'IQ Test',
      numberOfQuestions: data.totalQuestions
    },
    inLanguage: data.locale
  };
}