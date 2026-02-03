import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
  action?: React.ReactElement
  duration?: number;
}

const toast = (props: ToastProps) => {
  const { title, description, variant, action, duration } = props

  if (variant === 'destructive') {
    sonnerToast.error(title, {
      description,
      action,
      duration,
    });
  } else {
    sonnerToast.info(title, {
      description,
      action,
      duration
    });
  }
};

// To maintain compatibility with existing components using the hook
export const useToast = () => {
  return { toast };
};
