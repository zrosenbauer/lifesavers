#!/usr/bin/env bash

#==========================================================================
# Docker Debug
#==========================================================================
#
# @decription Use this to log output to a file so you can debug your Dockerfile
#  ### features
#   - Increases the log output so you can get more data (i.e. yarn.lock)
#   - Uses plain output and no-cache so you always get a fresh hit on commands (i.e. RUN ls -la)
# @example
#   Copy the file to your directory: `cp ./scripts/docker/docker-debug-output.sh ./$MY_DIR/docker-debug-output.sh`
#   and add as executable `chmod u+x ./$MY_DIR/docker-debug-output.sh` and run!
#
#   `cd ./$MY_DIR && ./docker-debug-output.sh`
# 

docker buildx create --use --name larger_log --driver-opt env.BUILDKIT_STEP_LOG_MAX_SIZE=50000000
docker buildx build --progress plain --no-cache . -t debug 2>&1 | tee docker-debug-output.log
