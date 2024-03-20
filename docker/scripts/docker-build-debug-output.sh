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
#   Copy the file to your directory: `cp ./scripts/docker/docker-build-debug-output.sh ./$MY_DIR/docker-build-debug-output.sh`
#   and add as executable `chmod u+x ./$MY_DIR/docker-build-debug-output.sh` and run!
#
#   `cd ./$MY_DIR && ./docker-build-debug-output.sh`
#

## Change this to your desired log file
LOG_FILE=docker-build-debug-output.log

docker buildx create --use --name docker_build_debug_larger_log --driver-opt env.BUILDKIT_STEP_LOG_MAX_SIZE=50000000 &> /dev/null

echo "==============================" > $LOG_FILE
echo "[DEBUG] Debugging Logger Build $(date '+%F_%H:%M:%S:%Z')" >> $LOG_FILE
echo "==============================" >> $LOG_FILE

docker buildx build --progress plain --no-cache . -t docker_build_debug_larger_log 2>&1 | tee -a $LOG_FILE 
