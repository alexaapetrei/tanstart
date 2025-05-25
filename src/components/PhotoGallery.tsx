/**
 * @file PhotoGallery component for displaying photos fetched from IndexedDB.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllPhotos, type Photo } from '@/lib/indexeddb';

/**
 * PhotoGallery component fetches and displays photos using TanStack Query.
 * It handles loading, error, and empty states, and renders photos in a responsive grid.
 */
const PhotoGallery: React.FC = () => {
  const {
    data: photos,
    isLoading,
    isError,
    error,
  } = useQuery<Photo[], Error>({
    queryKey: ['photos'],
    queryFn: getAllPhotos,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
        <svg className="animate-spin h-8 w-8 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg">Loading photos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-destructive">
        {/* Basic Error Icon (can be replaced with a more sophisticated one) */}
        <svg className="h-8 w-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p className="text-lg font-semibold">Error Fetching Photos</p>
        <p className="text-sm">{error?.message || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
        {/* Basic Empty Icon (can be replaced) */}
        <svg className="h-8 w-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <p className="text-lg">No Photos Yet</p>
        <p className="text-sm">Upload some photos to see them here!</p>
      </div>
    );
  }

  return (
    <div className="pb-4"> {/* Removed p-4, parent on route provides it. Added pb-4 for bottom spacing */}
      {/* The H2 from the route page src/routes/photos.tsx already serves as the title for this section */}
      {/* <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">Photo Gallery</h2> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className="group relative border bg-card rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out"
          >
            <img
              src={photo.data}
              alt={photo.name}
              className="w-full h-auto object-cover aspect-square transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p 
                className="text-sm font-medium text-white truncate group-hover:whitespace-normal" 
                title={photo.name}
              >
                {photo.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoGallery;
