
// This component is kept for backward compatibility
// We're using sonner instead of this custom toaster

import { useToast } from "@/hooks/use-toast"; // Using our lightweight compatibility wrapper
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();
  
  // Return an empty fragment since we're using sonner
  return null;
}
