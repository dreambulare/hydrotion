import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="pagination" aria-label="Post pages">
      <PageLink page={currentPage - 1} disabled={currentPage === 1}>
        Previous
      </PageLink>
      <div className="pagination-pages">
        {pages.map((page) => (
          <PageLink page={page} key={page} current={page === currentPage}>
            {page}
          </PageLink>
        ))}
      </div>
      <PageLink page={currentPage + 1} disabled={currentPage === totalPages}>
        Next
      </PageLink>
    </nav>
  );
}

function PageLink({
  page,
  current = false,
  disabled = false,
  children
}: {
  page: number;
  current?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="pagination-link is-disabled" aria-disabled="true">
        {children}
      </span>
    );
  }

  return (
    <Link className="pagination-link" aria-current={current ? "page" : undefined} href={pageHref(page)}>
      {children}
    </Link>
  );
}

function pageHref(page: number) {
  return page <= 1 ? "/" : `/?page=${page}`;
}
