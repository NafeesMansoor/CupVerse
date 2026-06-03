export function parseRoute() {
  const raw = location.hash.slice(1) || 'home';
  const [page, ...rest] = raw.split('/');
  if (page === 'match' && rest[0]) return { page: 'match', params: { id: rest[0] } };
  return { page: page || 'home', params: {} };
}

export function navigateTo(path) {
  location.hash = path;
}
