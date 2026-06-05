export function parseRoute() {
  const raw = location.hash.slice(1) || 'home';
  const [page, ...rest] = raw.split('/');
  if (page === 'match'           && rest[0]) return { page: 'match',  params: { id: rest[0] } };
  if (page === 'team'            && rest[0]) return { page: 'team',   params: { name: decodeURIComponent(rest[0]) } };
  if (page === 'venue'           && rest[0]) return { page: 'venue',  params: { id: rest[0] } };
  if (page === 'prediction-tree')            return { page: 'prediction-tree', params: {} };
  return { page: page || 'home', params: {} };
}

export function navigateTo(path) {
  location.hash = path;
}
