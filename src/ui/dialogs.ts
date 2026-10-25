import Swal from "sweetalert2";

interface ConfirmOptions {
  title: string;
  text: string;
  confirmText?: string;
}

export async function confirmDestructive({
  title,
  text,
  confirmText = "Continuar",
}: ConfirmOptions): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    buttonsStyling: false,
    focusCancel: true,
    customClass: {
      popup: "dock-swal",
      title: "dock-swal-title",
      htmlContainer: "dock-swal-text",
      confirmButton: "btn btn-danger",
      cancelButton: "btn",
      actions: "dock-swal-actions",
    },
  });

  return result.isConfirmed;
}

export function toastSuccess(title: string): void {
  void Swal.fire({
    toast: true,
    position: "bottom-end",
    icon: "success",
    title,
    showConfirmButton: false,
    timer: 2600,
    timerProgressBar: true,
    customClass: {
      popup: "dock-toast",
      title: "dock-toast-title",
    },
  });
}

/**
 * Aviso de fallo. Sin esto los errores de Firestore se tragaban en silencio:
 * el usuario pulsaba "Guardar" y no pasaba nada. Se queda más tiempo que el
 * toast de éxito porque hay que leerlo.
 */
export function toastError(title: string): void {
  void Swal.fire({
    toast: true,
    position: "bottom-end",
    icon: "error",
    title,
    showConfirmButton: false,
    timer: 4200,
    timerProgressBar: true,
    customClass: {
      popup: "dock-toast",
      title: "dock-toast-title",
    },
  });
}
