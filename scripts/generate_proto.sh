#!/usr/bin/bash
rm -rf generated/*
mkdir -p generated
pwd=$(pwd)

cd proto/

PLUGIN_PATH="$pwd/node_modules/.bin/protoc-gen-ts_proto"
PROTO_OUT="--ts_proto_out=$pwd/generated/"

OPTION="--ts_proto_opt=useOptionals=none,\
snakeToCamel=true,\
stringEnums=true,\
addNestjsRestParameter=true,\
outputSchema=true,\
usePrototypeForDefaults=true,\
useSnakeTypeName=true"

protoc --plugin=$PLUGIN_PATH "$OPTION" "$PROTO_OUT" ./api.proto
