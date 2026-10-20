import { useCallback, useEffect, useState } from 'react';
import { documentService } from '../services/documentService.js';

/**
 * Custom hook for managing paginated and filtered document lists.
 * @param {object} [options]
 * @param {string} [options.initialStatus='']
 * @param {number} [options.initialPage=1]
 * @param {number} [options.pageSize=10]
 */
export const useDocuments = ({ initialStatus = '', initialPage = 1, pageSize = 10 } = {}) => {
  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(initialPage);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await documentService.listDocuments({
        status: status || undefined,
        page,
        pageSize,
      });
      setDocuments(response.data || []);
      setPagination(
        response.pagination || {
          page,
          pageSize,
          total: response.data?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(err);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [status, page, pageSize]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleStatusChange = newStatus => {
    setStatus(newStatus);
    setPage(1); // Reset to page 1 on filter switch
  };

  const handlePageChange = newPage => {
    setPage(newPage);
  };

  const updateLocalDocument = updatedDoc => {
    setDocuments(prev => prev.map(item => (item.id === updatedDoc.id ? updatedDoc : item)));
  };

  return {
    documents,
    pagination,
    status,
    page,
    isLoading,
    error,
    setStatus: handleStatusChange,
    setPage: handlePageChange,
    refresh: fetchDocuments,
    updateLocalDocument,
  };
};

export default useDocuments;
