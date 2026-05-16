#!/bin/bash
export PATH="/opt/homebrew/opt/postgresql@17/bin:/usr/local/bin:$PATH"
cd "$(dirname "$0")"
npm run dev
