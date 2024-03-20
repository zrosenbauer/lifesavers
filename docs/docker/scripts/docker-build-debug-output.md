# Docker Debug Build Debug

Use this to log output to a file so you can debug your Dockerfile. 

## Description

Use this to log output to a file so you can debug your Dockerfile.

 - Increases the log output so you can get more data (i.e. yarn.lock)
 - Uses plain output and no-cache so you always get a fresh hit on commands (i.e. RUN ls -la)

## Example

Copy the file to your directory: `cp ./scripts/docker/docker-build-debug-output.sh ./$MY_DIR/docker-build-debug-output.sh`
 and add as executable `chmod u+x ./$MY_DIR/docker-build-debug-output.sh` and run!
 `cd ./$MY_DIR && ./docker-build-debug-output.sh`
