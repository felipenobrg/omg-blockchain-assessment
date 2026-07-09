const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const paginate = (items, query) => {
  const total = items.length;

  if (query.limit === undefined && query.offset === undefined) {
    return { items, total, limit: total, offset: 0 };
  }

  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);

  return { items: items.slice(offset, offset + limit), total, limit, offset };
};

module.exports = { paginate };
