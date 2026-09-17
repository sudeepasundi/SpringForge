import { Navigate, useParams } from 'react-router-dom';
import { basicsGuides, getBasicsGuide } from '@/content/basics';
import { guideComponent, prefetchGuide } from '@/lib/basics';
import { GuideArticle } from '@/components/guides/GuideArticle';

export default function BasicsGuidePage() {
  const { guideSlug } = useParams();
  const guide = getBasicsGuide(guideSlug);

  if (!guide) return <Navigate to="/basics" replace />;

  const index = basicsGuides.findIndex((g) => g.slug === guide.slug);
  const prev = basicsGuides[index - 1];
  const next = basicsGuides[index + 1];

  return (
    <GuideArticle
      contentKey={guide.slug}
      breadcrumb={[{ label: 'Basics', to: '/basics' }, { label: 'Guides' }]}
      title={guide.title}
      summary={guide.summary}
      minutes={guide.minutes}
      // A cached lazy component: its identity is stable for a given slug.
      Content={guideComponent(guide.slug)}
      lessons={guide.lessons}
      prev={
        prev && {
          to: `/basics/${prev.slug}`,
          title: prev.title,
          label: 'Previous guide',
          onIntent: () => prefetchGuide(prev.slug),
        }
      }
      next={
        next && {
          to: `/basics/${next.slug}`,
          title: next.title,
          label: 'Next guide',
          onIntent: () => prefetchGuide(next.slug),
        }
      }
    />
  );
}
