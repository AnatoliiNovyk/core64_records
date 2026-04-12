# Release Track Upload Limit 20MB

## Previous state

- Admin release track upload rejected files larger than 6MB.
- Backend JSON body limit and track schema cap were too strict for larger base64 audio payloads.
- Users with typical track sizes around 8MB could not upload tracks.

## What was changed

- Increased frontend/admin track file limit from 6MB to 20MB in `admin.js`.
- Updated admin upload error messages to display the new 20MB limit in both UK and EN locales.
- Increased backend JSON request body limit from `10mb` to `60mb` in `backend/src/server.js`.
- Increased release track `audioDataUrl` validation cap from `12,000,000` to `30,000,000` characters in `backend/src/middleware/validate.js`.

## Resulting improvement

- Track uploads around 8MB now pass upload validation and can be saved.
- The release track flow is more aligned with real-world audio file sizes while preserving MP3/WAV-only constraints.
- Frontend and backend limits are now consistent enough to avoid false "file too large" rejections for standard tracks.
