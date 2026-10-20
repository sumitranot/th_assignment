import React, { useRef, useState } from 'react';
import { documentService } from '../../services/documentService.js';
import { Button } from '../ui/Button.jsx';
import { FormField } from '../ui/FormField.jsx';

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const SubmissionForm = ({ onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState(null);

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = e => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Client-side file validation (server remains source of truth)
    const ext = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrors(prev => ({
        ...prev,
        file: `File type "${ext}" not supported. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
      }));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrors(prev => ({
        ...prev,
        file: `File size exceeds the 5 MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)`,
      }));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (selectedFile.size === 0) {
      setErrors(prev => ({
        ...prev,
        file: 'Uploaded file cannot be empty (0 bytes)',
      }));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFile(selectedFile);
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.file;
      delete copy.content;
      return copy;
    });
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }

    const hasText = textContent.trim().length > 0;
    const hasFile = Boolean(file);

    if (!hasText && !hasFile) {
      newErrors.content = 'Please provide either text content or upload a file (or both)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setGeneralError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      if (textContent.trim()) {
        formData.append('textContent', textContent.trim());
      }
      if (file) {
        formData.append('file', file);
      }

      const createdDoc = await documentService.createDocument(formData);

      // Reset form
      setTitle('');
      setDescription('');
      setTextContent('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setErrors({});

      if (onSuccess) {
        onSuccess(createdDoc);
      }
    } catch (err) {
      setGeneralError(err.message || 'Failed to submit document');
      if (err.details) {
        setErrors(err.details);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate id="document-submission-form">
      {generalError && (
        <div className="error-banner" role="alert" id="submission-general-error">
          <span>{generalError}</span>
          <button
            type="button"
            onClick={() => setGeneralError('')}
            style={{ color: 'inherit', fontWeight: 'bold' }}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {errors.content && (
        <div className="error-banner" role="alert" id="content-requirement-error">
          <span>{Array.isArray(errors.content) ? errors.content[0] : errors.content}</span>
        </div>
      )}

      <FormField
        id="document-title-input"
        label="Document Title"
        required
        error={errors.title}
        hint="A concise title for your document (max 200 chars)"
      >
        <input
          id="document-title-input"
          type="text"
          className={`form-input ${errors.title ? 'is-invalid' : ''}`}
          placeholder="e.g. Q4 Budget Proposal"
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
          }}
          maxLength={200}
          required
        />
      </FormField>

      <FormField
        id="document-description-input"
        label="Description"
        optional
        error={errors.description}
        hint="Summary or context for reviewers (max 1000 chars)"
      >
        <input
          id="document-description-input"
          type="text"
          className="form-input"
          placeholder="Brief summary of document purpose"
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={1000}
        />
      </FormField>

      <FormField
        id="document-text-content-input"
        label="Text Content"
        optional
        error={errors.textContent}
        hint="Directly input proposal or document text (required if no file attached)"
      >
        <textarea
          id="document-text-content-input"
          className="form-textarea"
          rows={4}
          placeholder="Enter document text or proposal details..."
          value={textContent}
          onChange={e => {
            setTextContent(e.target.value);
            if (errors.content) setErrors(prev => ({ ...prev, content: '' }));
          }}
        />
      </FormField>

      <FormField
        id="document-file-input"
        label="Attach File"
        optional
        error={errors.file}
        hint="Max 5 MB (PDF, TXT, MD, DOC, DOCX, PNG, JPG)"
      >
        <div
          className="file-dropzone"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Upload document attachment"
        >
          <input
            id="document-file-input"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            aria-describedby="document-file-input-hint"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ margin: '0 auto var(--space-2)', color: 'var(--color-primary)' }}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text)' }}>
            Click or drag a file to attach
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            PDF, TXT, MD, DOC, DOCX, PNG, JPG up to 5 MB
          </p>
        </div>

        {file && (
          <div className="file-preview" id="selected-file-preview">
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <strong>{file.name}</strong>
              <span style={{ color: 'var(--color-text-light)' }}>
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={removeFile}
              aria-label="Remove selected file"
            >
              Remove
            </button>
          </div>
        )}
      </FormField>

      <Button
        type="submit"
        id="submit-document-button"
        variant="primary"
        size="lg"
        className="btn-full"
        isLoading={isSubmitting}
        style={{ marginTop: 'var(--space-2)' }}
      >
        Submit Document
      </Button>
    </form>
  );
};

export default SubmissionForm;
