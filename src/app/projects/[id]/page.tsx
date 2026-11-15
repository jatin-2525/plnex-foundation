import type { Metadata } from 'next';
import { MOCK_PROJECTS } from '../../../lib/api/mockData';
import ProjectOverviewClient from './ProjectOverviewClient';

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return [
    ...MOCK_PROJECTS.map((p) => ({ id: p.id })),
    ...MOCK_PROJECTS.map((p) => ({ id: p.code })),
    { id: 'all' },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = MOCK_PROJECTS.find((p) => p.id === id || p.code === id);

  if (!project) {
    return {
      title: 'Project Controls Overview',
      description: 'In-depth project controls breakdown featuring baseline milestones, S-curve progression, work package statuses, and contractor assignments.',
    };
  }

  const title = `${project.name} (${project.code})`;
  const description = `Project controls and progress monitoring for ${project.name} (${project.code}) in ${project.location}. Target completion: ${project.targetCompletionDate}.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | PLnEX`,
      description,
      url: `https://plnex.oilindia.in/projects/${project.id}/`,
      type: 'website',
      images: [
        {
          url: '/og-projects.png',
          width: 1200,
          height: 630,
          alt: `Project controls and milestone progress overview for ${project.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | PLnEX`,
      description,
      images: ['/og-projects.png'],
    },
  };
}

export default function Page() {
  return <ProjectOverviewClient />;
}
