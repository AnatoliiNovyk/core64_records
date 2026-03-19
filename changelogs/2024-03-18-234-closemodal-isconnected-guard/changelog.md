# Changelog

## [Unreleased] - 2024-03-18
### Added
- Hardened `closeModal` by guarding `modal` element presence/connectivity before `classList.add("hidden")`, preventing runtime errors on missing or detached modal nodes.