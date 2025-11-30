import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  structuredData?: object;
}

export const SEO = ({
  title,
  description,
  keywords,
  ogImage = 'https://linqboard.nl/social-share-image.png',
  ogType = 'website',
  canonical,
  structuredData,
}: SEOProps) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'nl';
  const baseUrl = 'https://linqboard.nl';
  const currentUrl = canonical || window.location.href;

  const languages = ['nl', 'en', 'es', 'de'];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={currentLang} />
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="LinqBoard" />
      <meta name="application-name" content="LinqBoard" />
      <meta name="theme-color" content="#8B5CF6" />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph Tags */}
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:locale" content={currentLang === 'nl' ? 'nl_NL' : currentLang === 'en' ? 'en_US' : currentLang === 'es' ? 'es_ES' : 'de_DE'} />
      <meta property="og:site_name" content="LinqBoard" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@linqboard" />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:url" content={currentUrl} />

      {/* Alternate Language Links */}
      {languages.map((lang) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={`${baseUrl}${window.location.pathname}${lang !== 'nl' ? `?lang=${lang}` : ''}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${window.location.pathname}`} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
