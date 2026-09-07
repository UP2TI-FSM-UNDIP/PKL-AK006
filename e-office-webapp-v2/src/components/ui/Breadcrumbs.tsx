import React from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb';

interface ParentBreadcrumb {
  label: string;
  href?: string;
}

interface SuratBreadcrumbProps {
  currentPage: string;
  parents?: ParentBreadcrumb[];
}

const Breadcrumbs: React.FC<SuratBreadcrumbProps> = ({
  currentPage,
  parents = [{ label: 'Form Pengajuan Surat', href: '#' }],
}) => (
  <div className='py-5'>
    <Breadcrumb>
      <BreadcrumbList>
        {parents.map((parent) => (
          <React.Fragment key={parent.href || parent.label}>
            <BreadcrumbItem>
              {parent.href ? (
                <BreadcrumbLink href={parent.href}>
                  {parent.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{parent.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
          </React.Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{currentPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </div>
);

export default Breadcrumbs;
