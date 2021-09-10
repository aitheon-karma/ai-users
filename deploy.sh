#!/bin/bash

set -ex
# build and push image to registery
./build.sh ${1} ${2}
CURRENT_DIR="${PWD##*/}"
NAMESPACE="$CURRENT_DIR"

# deploy k8s
kubectl apply -f ./k8s/0-namespace.yaml
kubectl apply -f ./k8s/1-config.yaml --namespace=$NAMESPACE
# Comment this line if not enought permissions and ask admin
kubectl get secret shared-config --export -o yaml | kubectl apply --namespace=$NAMESPACE -f -
kubectl apply -f ./k8s --namespace=$NAMESPACE