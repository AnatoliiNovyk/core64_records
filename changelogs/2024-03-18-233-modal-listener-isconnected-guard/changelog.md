# Changelog

## [Unreleased] - 2024-03-18
### Added
- Hardened modal overlay event wiring by guarding `modal` element presence/connectivity before registering click listener, preventing runtime errors when modal root is missing or detached.