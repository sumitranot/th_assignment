import React from 'react';

export const Skeleton = ({ height = 20, width = '100%', count = 1, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`skeleton ${className}`}
          style={{ height, width }}
          aria-hidden="true"
        />
      ))}
    </>
  );
};

export default Skeleton;
