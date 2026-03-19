# Change Log

## 2024-03-18 #278
- Hardened `openModal` with connectivity re-checks right before `fields.innerHTML` and before `modal.classList.remove("hidden")`.
- Prevented detached-element mutations if modal nodes unmount between initial guard and subsequent writes.
- Preserved existing modal title, field generation, and icon initialization behavior.
