
/// <reference types="vite/client" />

declare namespace JSX {
  interface HTMLAttributes<T> extends React.HTMLAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}
