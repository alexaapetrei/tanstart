/**
 * @file PhotoUpload component for selecting and uploading photos to IndexedDB.
 */
import React, { useState, ChangeEvent, useRef } from 'react';
import { addPhoto } from '../lib/indexeddb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * PhotoUpload component allows users to select an image file and upload it.
 * It handles file reading, interaction with IndexedDB, and displays loading/status messages.
 */
const PhotoUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles the change event of the file input.
   * Updates the selectedFile state with the chosen file.
   * @param event - The change event from the file input.
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(null); // Clear previous messages
    setMessageType(null);
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  /**
   * Handles the photo upload process.
   * Reads the selected file as Base64, then adds it to IndexedDB.
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file first.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage(null);
    setMessageType(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target?.result as string;
        if (!base64Data) {
          throw new Error('Failed to read file data.');
        }

        const photoId = await addPhoto({
          name: selectedFile.name,
          type: selectedFile.type,
          data: base64Data,
        });
        setMessage(`Photo "${selectedFile.name}" uploaded successfully! ID: ${photoId}`);
        setMessageType('success');
        setSelectedFile(null); 
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear the actual file input
        }
      } catch (error) {
        console.error('Upload error:', error);
        setMessage(`Error uploading photo: ${error instanceof Error ? error.message : String(error)}`);
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      setMessage(`Error reading file: ${reader.error?.message || 'Unknown error'}`);
      setMessageType('error');
      setLoading(false);
    };

    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="bg-card text-card-foreground p-6 space-y-6 rounded-lg shadow-lg max-w-lg mx-auto border">
      <h3 className="text-2xl font-semibold text-center text-primary">Upload a New Photo</h3>
      <div className="space-y-2">
        <label htmlFor="file-upload" className="text-sm font-medium text-muted-foreground">
          Select image file (e.g., .jpg, .png, .gif)
        </label>
        <Input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
          className="file:text-primary-foreground file:bg-primary hover:file:bg-primary/90"
        />
      </div>
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        className="w-full transition-all duration-150 ease-in-out"
        variant={loading ? "outline" : "default"}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </>
        ) : (
          'Upload Photo'
        )}
      </Button>
      {message && (
        <div
          className={cn(
            'mt-4 p-3 rounded-md text-sm text-center border',
            messageType === 'error' ? 'bg-destructive/10 border-destructive text-destructive-foreground' : 'bg-constructive/10 border-constructive text-constructive-foreground',
          )}
          role={messageType === 'error' ? "alert" : "status"}
        >
          <p className="font-medium">{messageType === 'error' ? 'Error:' : 'Success!'}</p>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
