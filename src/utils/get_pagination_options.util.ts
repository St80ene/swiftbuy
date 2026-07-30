export const getPaginationOptions = (paginationQuery: Record<string, any>) => {
  const { page = 1, limit = 10 } = paginationQuery;
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.max(1, Number(limit) || 10);
  const skip = (pageNumber - 1) * limitNumber;

  return { page: pageNumber, limit: limitNumber, skip };
};
