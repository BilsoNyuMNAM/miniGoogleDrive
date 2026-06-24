/**
 * Format file size in bytes to a human-readable string.
 * @param {number} bytes
 * @returns {string} e.g. "1.2 MB", "340 KB"
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size < 10 && i > 0 ? size.toFixed(1) : Math.round(size)} ${units[i]}`;
}

/**
 * Format a date string to a relative time string.
 * @param {string} dateString
 * @returns {string} e.g. "2 hours ago", "3 days ago"
 */
export function formatRelativeTime(dateString) {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

/**
 * Get an emoji icon based on MIME type.
 * @param {string} mimetype
 * @returns {string} emoji
 */
export function getFileIcon(mimetype) {
  if (!mimetype) return '📁';
  if (mimetype.startsWith('image/')) return '📷';
  if (mimetype.startsWith('video/')) return '🎬';
  if (mimetype.startsWith('audio/')) return '🎵';
  if (mimetype === 'application/pdf') return '📄';
  if (mimetype.includes('zip') || mimetype.includes('tar') || mimetype.includes('rar') || mimetype.includes('7z') || mimetype.includes('compressed') || mimetype.includes('archive')) return '📦';
  if (mimetype.includes('spreadsheet') || mimetype.includes('excel') || mimetype === 'text/csv') return '📊';
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return '📽️';
  if (mimetype.includes('document') || mimetype.includes('word') || mimetype.includes('msword')) return '📝';
  if (mimetype.startsWith('text/')) return '📝';
  if (mimetype.includes('json') || mimetype.includes('xml') || mimetype.includes('javascript') || mimetype.includes('typescript')) return '💻';
  return '📁';
}

/**
 * Get an accent color based on file type — using Cursor timeline palette.
 * Peach (#dfa88f), Mint (#9fc9a2), Blue (#9fbbe0), Lavender (#c0a8dd), Gold (#c08532).
 * @param {string} mimetype
 * @returns {string} CSS color
 */
export function getFileColor(mimetype) {
  if (!mimetype) return '#807d72';
  if (mimetype.startsWith('image/')) return '#9fbbe0';      /* timeline-read: blue */
  if (mimetype.startsWith('video/')) return '#c0a8dd';       /* timeline-edit: lavender */
  if (mimetype.startsWith('audio/')) return '#c08532';        /* timeline-done: gold */
  if (mimetype === 'application/pdf') return '#dfa88f';      /* timeline-thinking: peach */
  if (mimetype.includes('zip') || mimetype.includes('tar') || mimetype.includes('compressed') || mimetype.includes('archive')) return '#9fc9a2'; /* timeline-grep: mint */
  if (mimetype.includes('spreadsheet') || mimetype.includes('excel') || mimetype === 'text/csv') return '#9fc9a2'; /* mint */
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return '#c08532'; /* gold */
  if (mimetype.includes('document') || mimetype.includes('word') || mimetype.includes('msword')) return '#9fbbe0'; /* blue */
  if (mimetype.startsWith('text/')) return '#c0a8dd';        /* lavender */
  if (mimetype.includes('json') || mimetype.includes('xml') || mimetype.includes('javascript')) return '#dfa88f'; /* peach */
  return '#807d72';
}

/**
 * Check if a mimetype can be previewed in the browser.
 * @param {string} mimetype
 * @returns {boolean}
 */
export function isPreviewable(mimetype) {
  if (!mimetype) return false;
  if (mimetype.startsWith('image/')) return true;
  if (mimetype.startsWith('video/')) return true;
  if (mimetype.startsWith('audio/')) return true;
  if (mimetype === 'application/pdf') return true;
  return false;
}

/**
 * Group flat files into categorized folders based on mimetype.
 * @param {Array} files 
 * @returns {Array} Folders array with their respective files.
 */
export function groupFilesByFolder(files) {
  const folders = {
    'Design Assets': [],
    'Tech Diagrams': [],
    'Documents': [],
    'Spreadsheets': [],
    'Archives': [],
    'Other': []
  };

  files.forEach(file => {
    const mime = file.mimetype || '';
    if (mime.startsWith('image/')) {
      folders['Design Assets'].push(file);
    } else if (mime.includes('drawio') || mime.includes('diagram')) {
      folders['Tech Diagrams'].push(file);
    } else if (mime.includes('pdf') || mime.includes('document') || mime.includes('word') || mime.startsWith('text/')) {
      if (mime.includes('csv')) {
        folders['Spreadsheets'].push(file);
      } else {
        folders['Documents'].push(file);
      }
    } else if (mime.includes('spreadsheet') || mime.includes('excel')) {
      folders['Spreadsheets'].push(file);
    } else if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('archive') || mime.includes('compressed')) {
      folders['Archives'].push(file);
    } else {
      folders['Other'].push(file);
    }
  });

  // Only return folders that have files, or maybe return all predefined ones?
  // The screenshot shows 5 predefined folders. We'll return them as an array.
  return Object.keys(folders)
    .filter(name => folders[name].length > 0)
    .map(name => ({
      id: name,
      name: name,
      files: folders[name]
    }));
}
