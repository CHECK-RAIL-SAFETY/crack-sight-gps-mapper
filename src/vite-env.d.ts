
/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    // Add any custom elements here
  }
  
  interface HTMLAttributes<T> extends React.HTMLAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}
