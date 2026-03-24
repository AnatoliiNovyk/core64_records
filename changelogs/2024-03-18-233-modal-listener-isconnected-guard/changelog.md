# Changelog

## Added

Hardened modal overlay event wiring by guarding `modal` element presence/connectivity before registering click listener, preventing runtime errors when modal root is missing or detached.
