#!/bin/bash
if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo "$(date): API healthy"
else
    echo "$(date): API DOWN — restarting"
    launchctl kickstart -k gui/$(id -u)/com.realworldclaw.api
fi
