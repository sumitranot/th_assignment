import { prisma } from '../../lib/prisma.js';

/**
 * Data access repository for Document model.
 * The only layer that interacts directly with Prisma for document operations.
 */
export class DocumentsRepository {
  /**
   * Default relation selection for document queries.
   */
  get includeRelations() {
    return {
      submitter: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    };
  }

  /**
   * Creates a new document record.
   *
   * @param {object} data
   * @returns {Promise<import('@prisma/client').Document>}
   */
  async create(data) {
    return prisma.document.create({
      data,
      include: this.includeRelations,
    });
  }

  /**
   * Finds a document by primary key ID.
   *
   * @param {string} id
   * @returns {Promise<import('@prisma/client').Document | null>}
   */
  async findById(id) {
    return prisma.document.findUnique({
      where: { id },
      include: this.includeRelations,
    });
  }

  /**
   * Retrieves a paginated list of documents with total count.
   *
   * @param {object} params
   * @param {object} params.where - Prisma where clause.
   * @param {number} params.skip - Offset.
   * @param {number} params.take - Limit.
   * @param {object} [params.orderBy] - Sorting order.
   * @returns {Promise<{ items: import('@prisma/client').Document[], total: number }>}
   */
  async findManyWithPagination({ where, skip, take, orderBy = { createdAt: 'desc' } }) {
    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take,
        orderBy,
        include: this.includeRelations,
      }),
      prisma.document.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Atomically updates document status only if it is currently in 'pending' status.
   * Prevents race conditions when two reviewers review the same document simultaneously.
   *
   * @param {object} params
   * @param {string} params.id - Document UUID.
   * @param {'approved' | 'rejected'} params.status - New status.
   * @param {string} params.reviewerId - Reviewer User ID.
   * @param {Date} params.reviewedAt - Timestamp.
   * @param {string | null} [params.reviewComment] - Optional review comment.
   * @returns {Promise<number>} Number of rows updated (1 if transition succeeded, 0 otherwise).
   */
  async atomicUpdateStatus({ id, status, reviewerId, reviewedAt, reviewComment }) {
    const result = await prisma.document.updateMany({
      where: {
        id,
        status: 'pending',
      },
      data: {
        status,
        reviewerId,
        reviewedAt,
        reviewComment: reviewComment || null,
      },
    });

    return result.count;
  }
}

export const documentsRepository = new DocumentsRepository();
export default documentsRepository;
