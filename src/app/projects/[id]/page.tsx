import { MOCK_PROJECTS } from '../../../lib/api/mockData';
import ProjectOverviewClient from './ProjectOverviewClient';

export function generateStaticParams() {
  return [
    ...MOCK_PROJECTS.map((p) => ({ id: p.id })),
    ...MOCK_PROJECTS.map((p) => ({ id: p.code })),
    { id: 'all' },
  ];
}

export default function Page() {
  return <ProjectOverviewClient />;
}
