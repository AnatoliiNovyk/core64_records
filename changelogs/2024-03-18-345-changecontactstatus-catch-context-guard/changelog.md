# 345 changeContactStatus catch context guard

- Added section/context and connected contacts DOM checks inside the changeContactStatus catch branch before showing failure alert.
- Prevents stale error alert when async status update fails after user leaves contacts section.
- Keeps behavior unchanged while contacts section is active.
