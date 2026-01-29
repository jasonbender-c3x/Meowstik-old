import { useState, useCallback } from 'react';

export interface UseLocalRepoReturn {
  directoryHandle: FileSystemDirectoryHandle | null;
  connect: () => Promise<void>;
  saveAgent: (fileName: string, content: string) => Promise<void>;
  error: Error | null;
}

/**
 * React hook for managing local file system access using the File System Access API.
 * Allows persisting agents to disk with user-granted directory permissions.
 * 
 * @returns {UseLocalRepoReturn} Object containing directory handle, connect function, saveAgent function, and error state
 */
export function useLocalRepo(): UseLocalRepoReturn {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Opens a directory picker dialog and stores the selected directory handle.
   * Handles permission denial gracefully.
   */
  const connect = useCallback(async () => {
    try {
      setError(null);
      
      // Check if File System Access API is available
      if (!('showDirectoryPicker' in window)) {
        throw new Error('File System Access API is not supported in this browser');
      }

      // Show directory picker dialog
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });

      setDirectoryHandle(handle);
    } catch (err) {
      // Handle user cancellation or permission denial
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError(new Error('Directory selection was cancelled'));
        } else if (err.name === 'NotAllowedError') {
          setError(new Error('Permission to access directory was denied'));
        } else {
          setError(err);
        }
      } else {
        setError(new Error('An unknown error occurred while selecting directory'));
      }
      setDirectoryHandle(null);
    }
  }, []);

  /**
   * Saves agent content to a file in the selected directory.
   * 
   * @param {string} fileName - Name of the file to create/overwrite
   * @param {string} content - Content to write to the file
   * @throws {Error} If no directory is connected or if file writing fails
   */
  const saveAgent = useCallback(async (fileName: string, content: string) => {
    try {
      setError(null);

      if (!directoryHandle) {
        throw new Error('No directory connected. Call connect() first.');
      }

      // Get or create file handle
      const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });

      // Request permission if needed
      const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
      if (permission === 'denied') {
        throw new Error('Permission to write file was denied');
      }

      // Create writable stream
      const writable = await fileHandle.createWritable();

      // Write content to file
      await writable.write(content);

      // Close the stream
      await writable.close();
    } catch (err) {
      // Handle permission denial and other errors
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError(new Error('Permission to write file was denied'));
        } else {
          setError(err);
        }
      } else {
        setError(new Error('An unknown error occurred while saving file'));
      }
      throw err;
    }
  }, [directoryHandle]);

  return {
    directoryHandle,
    connect,
    saveAgent,
    error,
  };
}
