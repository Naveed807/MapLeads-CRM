import Swal from "sweetalert2";

// ─── Base theme ────────────────────────────────────────────────────────────────
const base = {
  confirmButtonColor: "#6366f1",
  cancelButtonColor:  "#64748b",
  borderRadius:       "14px",
  customClass: {
    popup:         "swal-popup",
    confirmButton: "swal-btn-confirm",
    cancelButton:  "swal-btn-cancel",
  },
};

// ─── Confirm dialog ────────────────────────────────────────────────────────────
/**
 * Shows a modern confirm dialog and returns true if confirmed.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.text]
 * @param {"warning"|"danger"|"info"|"question"} [opts.type]
 * @param {string} [opts.confirmText]
 * @param {string} [opts.cancelText]
 */
export async function swalConfirm({
  title,
  text,
  type = "warning",
  confirmText = "Yes, proceed",
  cancelText  = "Cancel",
} = {}) {
  const iconMap = { warning: "warning", danger: "error", info: "info", question: "question" };
  const colorMap = { warning: "#f59e0b", danger: "#ef4444", info: "#6366f1", question: "#8b5cf6" };

  const result = await Swal.fire({
    ...base,
    title,
    text,
    icon:              iconMap[type] || "warning",
    confirmButtonColor: colorMap[type] || base.confirmButtonColor,
    showCancelButton:  true,
    confirmButtonText: confirmText,
    cancelButtonText:  cancelText,
    reverseButtons:    true,
    focusCancel:       true,
  });

  return result.isConfirmed;
}

// ─── Toast notifications ───────────────────────────────────────────────────────
const Toast = Swal.mixin({
  toast:            true,
  position:         "bottom-end",
  showConfirmButton: false,
  timer:            3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

/**
 * Shows a toast notification.
 * @param {"success"|"error"|"warning"|"info"} type
 * @param {string} message
 * @param {number} [timer=3000]
 */
export function swalToast(type, message, timer = 3000) {
  Toast.fire({ icon: type, title: message, timer });
}

// Convenience shorthands
export const toast = {
  success: (msg, timer) => swalToast("success", msg, timer),
  error:   (msg, timer) => swalToast("error",   msg, timer),
  warning: (msg, timer) => swalToast("warning", msg, timer),
  info:    (msg, timer) => swalToast("info",    msg, timer),
};
