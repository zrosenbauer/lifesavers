#!/usr/bin/env bash

#==========================================================================
# Docker Debug
#==========================================================================
#
# @decription Use this to log output to a file so you can debug your Dockerfile
# @features:
#   - Ups the output so you can get more data (i.e. yarn.lock)
#   - Uses plain output and no-cache so you always get a fresh hit on commands (i.e. RUN ls -la)
# 

docker buildx create --use --name larger_log --driver-opt env.BUILDKIT_STEP_LOG_MAX_SIZE=50000000
docker buildx --progress=plain --no-cache . -t test-12 2>&1 | tee docker-output.log
