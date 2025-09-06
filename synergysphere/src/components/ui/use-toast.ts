import * as React from "react"
import { useToast as useToastPrimitive } from "@/components/ui/toast"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

export function useToast() {
  const { toast } = useToastPrimitive()

  return React.useMemo(
    () => ({
      toast: (props: ToastProps) => {
        return toast({
          variant: props.variant,
          title: props.title,
          description: props.description,
          duration: props.duration || 5000,
        })
      },
      dismiss: (toastId?: string) => {
        // @ts-ignore - dismiss is not in the type definition but exists in the implementation
        if (toast.dismiss) {
          // @ts-ignore
          toast.dismiss(toastId)
        }
      },
    }),
    [toast]
  )
}
